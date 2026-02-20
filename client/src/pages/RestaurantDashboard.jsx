import api from "../api/client.js";
import TextInput from "../components/TextInput.jsx";
import Button from "../components/Button.jsx";
import { useEffect, useState } from "react";

export default function RestaurantDashboard() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", imageUrl: "" });
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/restaurant/menu");
      setMenu(data || []);
      try {
        const profile = await api.get("/user/profile");
        setIsOpen(profile.data?.isOpen !== false);
      } catch (_err) {
        // ignore profile fetch error
      }
      setError("");
      try {
        const { data: m } = await api.get("/restaurant/metrics");
        setMetrics(m);
      } catch (_err) {
        setMetrics(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createItem = async (e) => {
    e.preventDefault();
    try {
      await api.post("/restaurant/food", { ...form, price: Number(form.price || 0) });
      setForm({ name: "", description: "", price: "", imageUrl: "" });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Create failed");
    }
  };

  const deleteItem = async (id) => {
    await api.delete(`/restaurant/food/${id}`);
    load();
  };

  const toggleOpen = async (next) => {
    try {
      setIsOpen(next);
      await api.patch("/restaurant/open", { isOpen: next });
    } catch (err) {
      setIsOpen(!next);
      alert(err?.response?.data?.message || err.message || "Failed to update open status");
    }
  };

  if (loading) return <div>Loading restaurant dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Restaurant Dashboard</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Open status</h2>
          <p className="text-sm text-slate-600">Control whether customers can place orders.</p>
        </div>
        <Button variant="ghost" onClick={() => toggleOpen(!isOpen)}>
          {isOpen ? "Set to Closed" : "Set to Open"}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Performance</h2>
        {!metrics ? (
          <div className="text-sm text-slate-600">No metrics yet.</div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3 text-sm text-slate-700">
            <MetricCard label="Total orders" value={metrics.totalOrders} />
            <MetricCard label="Delivered" value={metrics.deliveredOrders} />
            <MetricCard label="Cancelled" value={metrics.cancelledOrders} />
            <MetricCard label="GMV" value={`₹${(metrics.totalGMV || 0).toFixed(2)}`} />
            <MetricCard label="Delivery fees" value={`₹${(metrics.totalDeliveryFees || 0).toFixed(2)}`} />
            <MetricCard label="Avg delivery (mins)" value={(metrics.avgDeliveryMins || 0).toFixed(1)} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Add menu item</h2>
        <form className="grid sm:grid-cols-3 gap-3" onSubmit={createItem}>
          <TextInput label="Name" name="name" value={form.name} onChange={onChange} required />
          <TextInput label="Description" name="description" value={form.description} onChange={onChange} />
          <TextInput label="Price" name="price" type="number" step="0.01" value={form.price} onChange={onChange} required />
          <TextInput label="Image URL" name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="https://..." />
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit">Add</Button>
          </div>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">My menu</h2>
        {!menu.length && <div className="text-slate-600">No items yet.</div>}
        <div className="space-y-2">
          {menu.map((item) => (
            <div key={item._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover border" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-100 border flex items-center justify-center text-xs text-slate-500">No image</div>
                )}
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-slate-600">{item.description}</div>
                  <div className="text-sm text-brand-700 font-semibold">₹{item.price?.toFixed(2)}</div>
                </div>
              </div>
              <Button variant="ghost" onClick={() => deleteItem(item._id)}>Delete</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
