import { useEffect, useState } from "react";
import api from "../api/client.js";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket } from "../api/socket.js";
import { useToast } from "../context/ToastContext.jsx";

const statusOptions = ["preparing", "cancelled"];

export default function RestaurantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const { user, token } = useAuth();
  const { pushToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/restaurant");
      setOrders(data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!user) return;
    setLoadingReviews(true);
    try {
      const restaurantId = user.id || user._id;
      const { data } = await api.get(`/reviews/restaurant/${restaurantId}`);
      setReviews(data || []);
    } catch (_err) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const { data } = await api.get("/driver/available");
      setDrivers(data || []);
    } catch (_err) {
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    load();
    loadReviews();
    loadDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    if (!socket) return;
    const handler = (order) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o._id === order._id);
        if (idx === -1) return [order, ...prev];
        const next = [...prev];
        next[idx] = order;
        return next;
      });
      const status = order.status;
      const type = status === "delivered" ? "success" : status === "cancelled" ? "warning" : "info";
      pushToast(`Order ${order._id.slice(-6)} updated: ${status}`, type);
    };
    socket.on("order:update", handler);
    return () => {
      socket.off("order:update", handler);
    };
  }, [token]);

  const updateStatus = async (id, status) => {
    setActingId(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Update failed", "error");
    } finally {
      setActingId(null);
    }
  };

  const acceptOrder = async (id) => {
    setActingId(id);
    try {
      await api.post(`/orders/${id}/restaurant/accept`);
      await load();
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Accept failed", "error");
    } finally {
      setActingId(null);
    }
  };

  const rejectOrder = async (id) => {
    setActingId(id);
    try {
      await api.post(`/orders/${id}/restaurant/reject`, { note: "Rejected by restaurant" });
      await load();
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Reject failed", "error");
    } finally {
      setActingId(null);
    }
  };

  const assignDriver = async (id, autoAssign = false) => {
    const driverId = autoAssign ? undefined : selectedDrivers[id];
    if (!autoAssign && !driverId) {
      pushToast("Select a driver first", "warning");
      return;
    }
    setAssigningId(id);
    try {
      await api.patch(`/orders/${id}/assign-driver`, autoAssign ? { autoAssign: true } : { driverId });
      await load();
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Assign failed", "error");
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) return <div>Loading restaurant orders...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Restaurant Orders</h1>
      {!orders.length && <div className="text-slate-600">No orders yet.</div>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Order #{o._id.slice(-6)}</span>
              <span>User: {o.userId?.username || o.userId}</span>
            </div>
            {o.driverAcceptance && (
              <div className="text-xs text-amber-600">Driver acceptance: {o.driverAcceptance}</div>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="font-semibold text-slate-700">Status:</span>
              {o.status === "placed" && (
                <>
                  <Button size="sm" variant="solid" disabled={actingId === o._id} onClick={() => acceptOrder(o._id)}>
                    {actingId === o._id ? "Accepting..." : "Accept"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={actingId === o._id} onClick={() => rejectOrder(o._id)}>
                    {actingId === o._id ? "Rejecting..." : "Reject"}
                  </Button>
                </>
              )}
              {o.status === "confirmed" && (
                <Button size="sm" variant="solid" disabled={actingId === o._id} onClick={() => updateStatus(o._id, "preparing")}>
                  {actingId === o._id ? "Updating..." : "Start preparing"}
                </Button>
              )}
              {statusOptions.map((s) => (
                <Button
                  key={s}
                  variant={s === o.status ? "solid" : "ghost"}
                  size="sm"
                  disabled={actingId === o._id || (s === "preparing" && o.status !== "confirmed")}
                  onClick={() => updateStatus(o._id, s)}
                >
                  {s.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
            {o.driverId ? (
              <div className="text-xs text-slate-600">Driver: {o.driverId.username || o.driverId}</div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold">Driver:</span>
              <span className="text-slate-900">{o.driverId?.username || o.driverId || "Unassigned"}</span>
              <select
                className="rounded border border-slate-200 px-2 py-1"
                value={selectedDrivers[o._id] || ""}
                onChange={(e) => setSelectedDrivers((d) => ({ ...d, [o._id]: e.target.value }))}
              >
                <option value="">Select driver</option>
                {drivers.map((d) => {
                  const val = d.id || d._id;
                  return (
                    <option key={val} value={val}>{d.username} ({d.email})</option>
                  );
                })}
              </select>
              <Button
                size="sm"
                variant="ghost"
                disabled={assigningId === o._id || (!drivers.length && !selectedDrivers[o._id])}
                onClick={() => assignDriver(o._id)}
              >
                {assigningId === o._id ? "Assigning..." : "Assign"}
              </Button>
              <Button
                size="sm"
                variant="solid"
                disabled={assigningId === o._id}
                onClick={() => assignDriver(o._id, true)}
              >
                {assigningId === o._id ? "Assigning..." : "Auto-assign"}
              </Button>
              {loadingDrivers && <span className="text-xs text-slate-500">Loading drivers...</span>}
              {!drivers.length && !loadingDrivers && <span className="text-xs text-red-500">No online drivers</span>}
            </div>
              <div className="text-sm text-slate-700">
              {o.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} x {it.quantity}</span>
                  <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-600">Payment: {o.paymentMethod?.toUpperCase()} — {o.paymentStatus || "pending"}</div>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{(o.subtotal ?? o.total ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>₹{(o.deliveryFee ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-₹{(o.discount ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-slate-800"><span>Total</span><span>₹{(o.total ?? 0).toFixed(2)}</span></div>
            </div>
            {o.statusHistory?.length ? (
              <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 space-y-1">
                {o.statusHistory.map((s, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{s.status.replaceAll("_", " ")}</span>
                    <span>{new Date(s.changedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reviews</h2>
          {loadingReviews && <span className="text-sm text-slate-500">Loading...</span>}
        </div>
        {!reviews.length && <div className="text-sm text-slate-600">No reviews yet.</div>}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.rating} ⭐</span>
                <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment ? <div className="text-slate-700">{r.comment}</div> : null}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Reply to customer"
                  value={replyDrafts[r._id] ?? r.reply ?? ""}
                  onChange={(e) => setReplyDrafts((d) => ({ ...d, [r._id]: e.target.value }))}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                />
                <Button
                  size="sm"
                  disabled={replyingId === r._id}
                  onClick={async () => {
                    setReplyingId(r._id);
                    try {
                      await api.patch(`/reviews/${r._id}/reply`, { reply: replyDrafts[r._id] ?? r.reply ?? "" });
                      await loadReviews();
                    } catch (err) {
                      alert(err?.response?.data?.message || err.message || "Reply failed");
                    } finally {
                      setReplyingId(null);
                    }
                  }}
                >
                  {replyingId === r._id ? "Saving..." : "Save reply"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
