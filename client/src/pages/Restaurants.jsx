import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import Button from "../components/Button.jsx";

const sorts = [
  { value: "rating", label: "Top rated" },
  { value: "eta", label: "Fastest" },
  { value: "fee", label: "Lowest fee" },
  { value: "new", label: "New" }
];

export default function Restaurants() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", cuisines: "", tags: "", sort: "rating", isOpen: true });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.cuisines) params.set("cuisines", filters.cuisines);
      if (filters.tags) params.set("tags", filters.tags);
      if (filters.isOpen) params.set("isOpen", "true");
      if (filters.sort && filters.sort !== "new") params.set("sort", filters.sort);
      const { data } = await api.get(`/catalog/restaurants?${params.toString()}`);
      setItems(data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilterChange = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const applyFilters = (e) => {
    e.preventDefault();
    load();
  };

  if (loading) return <div>Loading restaurants...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurants</h1>
      </div>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Search</label>
          <input
            value={filters.q}
            onChange={(e) => onFilterChange("q", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Restaurant or cuisine"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Cuisines (comma)</label>
          <input
            value={filters.cuisines}
            onChange={(e) => onFilterChange("cuisines", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Indian, Chinese"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Tags</label>
          <input
            value={filters.tags}
            onChange={(e) => onFilterChange("tags", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Biryani, Pizza"
          />
        </div>
        <div className="flex items-end gap-3 md:col-span-2">
          <div className="flex-1">
            <label className="text-sm font-semibold text-slate-700">Sort by</label>
            <select
              value={filters.sort}
              onChange={(e) => onFilterChange("sort", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={filters.isOpen} onChange={(e) => onFilterChange("isOpen", e.target.checked)} />
            Open now
          </label>
          <Button type="submit">Apply</Button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((r) => (
          <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{r.username}</div>
                <div className="text-xs text-slate-500">{r.cuisines?.join(", ")}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">{(r.ratingAvg || 0).toFixed(1)} ⭐</div>
                <div className="text-slate-500">{r.ratingCount || 0} ratings</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 text-xs text-slate-600">
              {r.tags?.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2 py-1">{t}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Fee: ₹{Number(r.deliveryFee || 0).toFixed(2)}</span>
              <span>ETA: {r.etaMins || 30} mins</span>
              <span className={`text-xs px-2 py-1 rounded-full ${r.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {r.isOpen ? "Open" : "Closed"}
              </span>
            </div>
            <div className="mt-2 flex justify-end">
              <Link to={`/restaurants/${r._id}`}><Button>View menu</Button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
