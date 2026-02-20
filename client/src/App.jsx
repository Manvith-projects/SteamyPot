import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Landing from "./pages/Landing.jsx";
import Restaurants from "./pages/Restaurants.jsx";
import RestaurantMenu from "./pages/RestaurantMenu.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import RestaurantDashboard from "./pages/RestaurantDashboard.jsx";
import RestaurantOrders from "./pages/RestaurantOrders.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

const HomeRoute = () => {
  const { user } = useAuth();
  if (user?.role === "user") return <Navigate to="/restaurants" replace />;
  if (user?.role === "restaurant") return <Navigate to="/dashboard/restaurant" replace />;
  if (user?.role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (user?.role === "driver") return <Navigate to="/dashboard/driver" replace />;
  return <Landing />;
};

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout><Outlet /></Layout>}>
          <Route element={<ProtectedRoute roles={["user"]} />}>
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantMenu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={["restaurant"]} />}>
            <Route path="/dashboard/restaurant" element={<RestaurantDashboard />} />
            <Route path="/dashboard/restaurant/orders" element={<RestaurantOrders />} />
          </Route>

          <Route element={<ProtectedRoute roles={["driver"]} />}>
            <Route path="/dashboard/driver" element={<DriverDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
