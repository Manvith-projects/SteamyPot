import { useEffect, useState } from "react";
import api from "../api/client.js";
import Button from "../components/Button.jsx";
import { connectSocket } from "../api/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const statusColors = {
  placed: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusSteps = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

const etaOffsetsMinutes = {
  placed: 35,
  confirmed: 30,
  preparing: 20,
  out_for_delivery: 12,
  delivered: 0,
  cancelled: 0
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changingId, setChangingId] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewingId, setReviewingId] = useState(null);
  const { token } = useAuth();
  const { pushToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/orders");
        setOrders(data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const cancelOrder = async (orderId) => {
    setChangingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: "cancelled", note: "Cancelled by user" });
      const { data } = await api.get("/orders");
      setOrders(data || []);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Cancel failed");
    } finally {
      setChangingId(null);
    }
  };

  const formatMoney = (n) => `₹${(n || 0).toFixed(2)}`;

  const confirmPayment = async (orderId) => {
    setChangingId(orderId);
    try {
      await api.post(`/payments/${orderId}/confirm`, { reference: `manual-${Date.now()}` });
      const { data } = await api.get("/orders");
      setOrders(data || []);
      pushToast("Payment marked as paid", "success");
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Payment confirm failed", "error");
    } finally {
      setChangingId(null);
    }
  };

  const submitReview = async (orderId) => {
    const draft = reviewDrafts[orderId] || { rating: 5, comment: "" };
    if (!draft.rating) {
      alert("Please add a rating");
      return;
    }
    setReviewingId(orderId);
    try {
      await api.post("/reviews", { orderId, rating: Number(draft.rating), comment: draft.comment });
      alert("Review submitted");
      setReviewDrafts((d) => ({ ...d, [orderId]: { rating: 5, comment: "" } }));
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Review failed");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const computeEta = (order) => {
    const baseTime = order.outForDeliveryAt || order.preparingAt || order.confirmedAt || order.createdAt;
    if (!baseTime) return null;
    const offset = etaOffsetsMinutes[order.status] ?? 20;
    const etaDate = new Date(new Date(baseTime).getTime() + offset * 60000);
    return etaDate;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Your Orders</h1>
      {!orders.length && <div className="text-slate-600">No orders yet.</div>}
      <div className="space-y-3">
        {orders.map((order) => {
          const canCancel = ["placed", "confirmed"].includes(order.status);
          const breakdown = {
            subtotal: order.subtotal ?? order.total,
            deliveryFee: order.deliveryFee ?? 0,
            discount: order.discount ?? 0,
            total: order.total ?? 0
          };
          const etaDate = computeEta(order);
          return (
            <div key={order._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600">Order #{order._id.slice(-6)}</div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {etaDate && order.status !== "delivered" && order.status !== "cancelled" ? (
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">ETA ~ {etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  ) : null}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-slate-200 text-slate-800"}`}>
                    {order.status}
                  </span>
                  {canCancel && (
                    <Button size="sm" variant="ghost" disabled={changingId === order._id} onClick={() => cancelOrder(order._id)}>
                      {changingId === order._id ? "Cancelling..." : "Cancel"}
                    </Button>
                  )}
                </div>
              </div>

              {order.driverId ? (
                <div className="text-xs text-slate-600">Driver: {order.driverId.username || order.driverId}</div>
              ) : null}

              {order.driverAcceptance && (
                <div className="text-xs text-slate-600">Driver assignment: {order.driverAcceptance}</div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">Progress</div>
                <div className="flex flex-wrap items-center gap-2">
                  {statusSteps.map((step, idx) => {
                    const reached = step === order.status || statusSteps.indexOf(step) <= statusSteps.indexOf(order.status);
                    const isCurrent = step === order.status;
                    const connectorActive = idx < statusSteps.length - 1 && statusSteps.indexOf(order.status) > idx;
                    return (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${reached ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={`text-xs font-semibold capitalize ${isCurrent ? "text-slate-900" : "text-slate-600"}`}>
                          {step.replaceAll("_", " ")}
                        </span>
                        {idx < statusSteps.length - 1 && (
                          <div className={`h-0.5 w-12 sm:w-16 ${connectorActive ? "bg-emerald-500" : "bg-slate-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1 text-sm text-slate-700">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} x {it.quantity}</span>
                    <span>{formatMoney(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap gap-2 items-center">
                <span className="font-semibold">Payment:</span>
                <span>{(order.paymentMethod || "cod").toUpperCase()}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{order.paymentStatus || "pending"}</span>
                {order.paymentStatus !== "paid" && order.paymentMethod !== "cod" && (
                  <Button size="xs" variant="ghost" disabled={changingId === order._id} onClick={() => confirmPayment(order._id)}>
                    {changingId === order._id ? "Marking..." : "Mark paid"}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(breakdown.subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{formatMoney(breakdown.deliveryFee)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(breakdown.discount)}</span></div>
                <div className="flex justify-between font-semibold text-slate-800"><span>Total</span><span>{formatMoney(breakdown.total)}</span></div>
              </div>

              {order.statusHistory?.length ? (
                <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 space-y-1">
                  {order.statusHistory.map((s, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{s.status.replaceAll("_", " ")}</span>
                      <span>{new Date(s.changedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {order.status === "delivered" && (
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="text-sm font-semibold text-slate-800">Leave a review</div>
                  <div className="flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-1">
                      <span className="text-slate-600">Rating</span>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={(reviewDrafts[order._id]?.rating) ?? 5}
                        onChange={(e) => setReviewDrafts((d) => ({ ...d, [order._id]: { ...(d[order._id] || {}), rating: e.target.value } }))}
                        className="w-16 rounded border border-slate-200 px-2 py-1"
                      />
                    </label>
                    <textarea
                      rows={2}
                      placeholder="How was it?"
                      value={reviewDrafts[order._id]?.comment || ""}
                      onChange={(e) => setReviewDrafts((d) => ({ ...d, [order._id]: { ...(d[order._id] || {}), comment: e.target.value } }))}
                      className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={reviewingId === order._id}
                      onClick={() => submitReview(order._id)}
                    >
                      {reviewingId === order._id ? "Sending..." : "Submit"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
