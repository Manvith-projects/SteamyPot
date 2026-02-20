import { useEffect, useState } from "react";
import api from "../api/client.js";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket } from "../api/socket.js";
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

export default function DriverDashboard() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(Boolean(user?.isOnline));
  const [toggling, setToggling] = useState(false);
  const [actingId, setActingId] = useState(null);
  const { pushToast } = useToast();
  const [acceptingId, setAcceptingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/driver/orders");
      setOrders(data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load driver orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOnline(Boolean(user?.isOnline));
    load();
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

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const next = !online;
      await api.patch("/driver/online", { isOnline: next });
      setOnline(next);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to update availability");
    } finally {
      setToggling(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActingId(id);
    try {
      await api.patch(`/driver/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Update failed");
    } finally {
      setActingId(null);
    }
  };

  const acceptAssignment = async (id) => {
    setAcceptingId(id);
    try {
      await api.post(`/driver/orders/${id}/accept`);
      await load();
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Accept failed", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  const declineAssignment = async (id) => {
    setAcceptingId(id);
    try {
      await api.post(`/driver/orders/${id}/decline`);
      await load();
    } catch (err) {
      pushToast(err?.response?.data?.message || err.message || "Decline failed", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <div>Loading driver dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <p className="text-sm text-slate-600">Manage your availability and assigned orders.</p>
        </div>
        <Button onClick={toggleOnline} disabled={toggling} variant={online ? "solid" : "ghost"}>
          {toggling ? "Updating..." : online ? "Go offline" : "Go online"}
        </Button>
      </div>

      {!orders.length && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600 shadow-sm">
          No assigned orders yet.
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const canMarkOut = ["confirmed", "preparing", "out_for_delivery"].includes(order.status);
          const canMarkDelivered = order.status === "out_for_delivery";
          const isPendingAcceptance = order.driverAcceptance === "pending";
          return (
            <div key={order._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Order #{order._id.slice(-6)}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-slate-200 text-slate-800"}`}>
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              {order.driverAcceptance && (
                <div className="text-xs text-amber-700">Driver acceptance: {order.driverAcceptance}</div>
              )}

              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                {statusSteps.map((step) => {
                  const reached = step === order.status || statusSteps.indexOf(step) <= statusSteps.indexOf(order.status);
                  return (
                    <span
                      key={step}
                      className={`rounded-full px-3 py-1 ${reached ? "bg-[#f1c9cd] text-[#721722]" : "bg-slate-100 text-slate-500"}`}
                    >
                      {step.replaceAll("_", " ")}
                    </span>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-800">
                <div>
                  <div className="text-slate-500 text-xs">Customer</div>
                  <div className="font-semibold">{order.userId?.username || "N/A"}</div>
                  <div className="text-xs text-slate-500">{order.userId?.email}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Restaurant</div>
                  <div className="font-semibold">{order.restaurantId?.username || "N/A"}</div>
                  <div className="text-xs text-slate-500">{order.restaurantId?.email}</div>
                </div>
              </div>

              <div className="space-y-1 text-sm text-slate-800">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} x {it.quantity}</span>
                    <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {isPendingAcceptance && (
                  <>
                    <Button
                      size="sm"
                      variant="solid"
                      disabled={acceptingId === order._id}
                      onClick={() => acceptAssignment(order._id)}
                    >
                      {acceptingId === order._id ? "Accepting..." : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={acceptingId === order._id}
                      onClick={() => declineAssignment(order._id)}
                    >
                      {acceptingId === order._id ? "Declining..." : "Decline"}
                    </Button>
                  </>
                )}

                {!isPendingAcceptance && canMarkOut && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actingId === order._id}
                    onClick={() => updateStatus(order._id, "out_for_delivery")}
                  >
                    {actingId === order._id ? "Updating..." : "Mark out for delivery"}
                  </Button>
                )}
                {!isPendingAcceptance && canMarkDelivered && (
                  <Button
                    size="sm"
                    variant="solid"
                    disabled={actingId === order._id}
                    onClick={() => updateStatus(order._id, "delivered")}
                  >
                    {actingId === order._id ? "Updating..." : "Mark delivered"}
                  </Button>
                )}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
