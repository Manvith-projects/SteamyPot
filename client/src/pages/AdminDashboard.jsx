import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import Button from "../components/Button.jsx";

export default function AdminDashboard() {
  const USER_LIMIT = 10;
  const ORDER_LIMIT = 10;

  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRoleFilter] = useState("");
  const [userBlocked, setUserBlocked] = useState("");
  const [userApproval, setUserApproval] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  const [restaurants, setRestaurants] = useState([]);
  const [food, setFood] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatic = async () => {
    try {
      const [r, f, m] = await Promise.all([
        api.get("/admin/restaurants?page=1&limit=50"),
        api.get("/admin/food?page=1&limit=50"),
        api.get("/admin/metrics")
      ]);
      setRestaurants(r.data?.data || r.data || []);
      setFood(f.data?.data || f.data || []);
      setMetrics(m.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users", {
        params: {
          page: userPage,
          limit: USER_LIMIT,
          search: userSearch || undefined,
          role: userRole || undefined,
          blocked: userBlocked || undefined,
          approval: userApproval || undefined
        }
      });
      setUsers(res.data?.data || res.data || []);
      setUsersTotal(res.data?.total || 0);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load users");
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get("/admin/orders", {
        params: {
          page: orderPage,
          limit: ORDER_LIMIT,
          status: orderStatus || undefined,
          search: orderSearch || undefined
        }
      });
      setOrders(res.data?.data || res.data || []);
      setOrdersTotal(res.data?.total || 0);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    loadStatic();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userPage, userSearch, userRole, userBlocked, userApproval]);

  useEffect(() => {
    loadOrders();
  }, [orderPage, orderStatus, orderSearch]);

  const approveRestaurant = async (id) => {
    try {
      await api.patch(`/admin/restaurants/${id}/approve`);
      await loadStatic();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Approve failed");
    }
  };

  const setRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role, approval: role === "restaurant" });
      await loadUsers();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Role update failed");
    }
  };

  const blockUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/block`);
      await loadUsers();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Block failed");
    }
  };

  const unblockUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/unblock`);
      await loadUsers();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Unblock failed");
    }
  };

  const replaceOrder = async (id) => {
    const note = window.prompt("Support note (optional)");
    if (note === null) return;
    try {
      await api.post(`/admin/orders/${id}/replace`, { note });
      await loadOrders();
      alert("Replacement order created");
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Replacement failed");
    }
  };

  const userPages = useMemo(() => Math.max(Math.ceil(usersTotal / USER_LIMIT), 1), [usersTotal]);
  const orderPages = useMemo(() => Math.max(Math.ceil(ordersTotal / ORDER_LIMIT), 1), [ordersTotal]);

  if (loading) return <div>Loading admin dashboard...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {metrics && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Platform metrics</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard label="Total orders" value={metrics.totalOrders} />
            <MetricCard label="Delivered" value={metrics.deliveredOrders} />
            <MetricCard label="Cancelled" value={metrics.cancelledOrders} />
            <MetricCard label="GMV" value={`₹${(metrics.totalGMV || 0).toFixed(2)}`} />
            <MetricCard label="Discounts" value={`₹${(metrics.totalDiscount || 0).toFixed(2)}`} />
            <MetricCard label="Delivery fees" value={`₹${(metrics.totalDeliveryFees || 0).toFixed(2)}`} />
            <MetricCard label="Avg delivery (mins)" value={(metrics.avgDeliveryMins || 0).toFixed(1)} />
          </div>
          {metrics.topRestaurants?.length ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Top restaurants (by revenue)</h3>
              <div className="space-y-2 text-sm text-slate-700">
                {metrics.topRestaurants.map((r) => (
                  <div key={r.restaurantId} className="flex justify-between">
                    <span>{r.name || r.restaurantId}</span>
                    <span className="font-semibold">₹{(r.revenue || 0).toFixed(2)} ({r.orders} orders)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Restaurants</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {restaurants.map((r) => (
            <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-semibold">{r.username}</div>
              <div className="text-sm text-slate-600">{r.email}</div>
              <div className="text-xs text-slate-500">Approved: {r.approval ? "Yes" : "No"}</div>
              {!r.approval && (
                <div className="mt-2"><Button onClick={() => approveRestaurant(r._id)}>Approve</Button></div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Users</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <input className="rounded border px-2 py-1" placeholder="Search user" value={userSearch} onChange={(e) => { setUserPage(1); setUserSearch(e.target.value); }} />
            <select className="rounded border px-2 py-1" value={userRole} onChange={(e) => { setUserPage(1); setUserRoleFilter(e.target.value); }}>
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="restaurant">Restaurant</option>
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
            <select className="rounded border px-2 py-1" value={userBlocked} onChange={(e) => { setUserPage(1); setUserBlocked(e.target.value); }}>
              <option value="">Blocked?</option>
              <option value="true">Blocked</option>
              <option value="false">Active</option>
            </select>
            <select className="rounded border px-2 py-1" value={userApproval} onChange={(e) => { setUserPage(1); setUserApproval(e.target.value); }}>
              <option value="">Approval</option>
              <option value="true">Approved</option>
              <option value="false">Not approved</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div>
                <div className="font-semibold">{u.username}</div>
                <div className="text-sm text-slate-600">{u.email}</div>
                <div className="text-xs text-slate-500">Role: {u.role}</div>
                <div className="text-xs text-slate-500">Blocked: {u.isBlocked ? "Yes" : "No"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.role !== "user" && <Button variant="ghost" onClick={() => setRole(u._id, "user")}>Set user</Button>}
                {u.role !== "restaurant" && <Button variant="ghost" onClick={() => setRole(u._id, "restaurant")}>Set restaurant</Button>}
                {u.role !== "driver" && <Button variant="ghost" onClick={() => setRole(u._id, "driver")}>Set driver</Button>}
                {u.role !== "admin" && <Button variant="ghost" onClick={() => setRole(u._id, "admin")}>Set admin</Button>}
                {!u.isBlocked && <Button variant="ghost" onClick={() => blockUser(u._id)}>Block</Button>}
                {u.isBlocked && <Button variant="ghost" onClick={() => unblockUser(u._id)}>Unblock</Button>}
              </div>
            </div>
          ))}
          {!users.length && <div className="text-slate-600">No users found.</div>}
        </div>
        <Pagination current={userPage} totalPages={userPages} onPrev={() => setUserPage(Math.max(1, userPage - 1))} onNext={() => setUserPage(Math.min(userPages, userPage + 1))} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Orders</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <input className="rounded border px-2 py-1" placeholder="Search order id / ref" value={orderSearch} onChange={(e) => { setOrderPage(1); setOrderSearch(e.target.value); }} />
            <select className="rounded border px-2 py-1" value={orderStatus} onChange={(e) => { setOrderPage(1); setOrderStatus(e.target.value); }}>
              <option value="">All statuses</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Order #{o._id.slice(-6)}</span>
                <span>User: {o.userId?.username || o.userId?.email || o.userId}</span>
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <div>Status: {o.status}</div>
                <div>Restaurant: {o.restaurantId?.username || o.restaurantId?.email || o.restaurantId}</div>
                <div>Payment: {(o.paymentMethod || "cod").toUpperCase()} • {o.paymentStatus || "pending"}</div>
              </div>
              <div className="text-sm text-slate-700">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} x {it.quantity}</span>
                    <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Delivery: {o.deliveryAddress}</span>
                <span className="font-semibold">Total: ₹{o.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => replaceOrder(o._id)}>Replace order</Button>
              </div>
            </div>
          ))}
          {!orders.length && <div className="text-slate-600">No orders found.</div>}
        </div>
        <Pagination current={orderPage} totalPages={orderPages} onPrev={() => setOrderPage(Math.max(1, orderPage - 1))} onNext={() => setOrderPage(Math.min(orderPages, orderPage + 1))} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Food items</h2>
        <div className="space-y-2">
          {food.map((item) => (
            <div key={item._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-slate-600">{item.description}</div>
                <div className="text-xs text-slate-500">Restaurant: {item.restaurantId}</div>
              </div>
            </div>
          ))}
          {!food.length && <div className="text-slate-600">No food items.</div>}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Pagination({ current, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
      <Button variant="ghost" onClick={onPrev} disabled={current <= 1}>Prev</Button>
      <span>Page {current} of {totalPages}</span>
      <Button variant="ghost" onClick={onNext} disabled={current >= totalPages}>Next</Button>
    </div>
  );
}
