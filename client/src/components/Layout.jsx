import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "./Button.jsx";

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm font-semibold ${active ? "text-[#e23744]" : "text-slate-600 hover:text-[#c81f32]"}`}
    >
      {children}
    </Link>
  );
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const homePath =
    user?.role === "user"
      ? "/restaurants"
      : user?.role === "restaurant"
        ? "/dashboard/restaurant"
        : user?.role === "admin"
          ? "/dashboard/admin"
          : user?.role === "driver"
            ? "/dashboard/driver"
            : "/";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8f7f5] to-[#f1efec] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-[#f1c9cd] bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to={homePath} className="text-lg font-extrabold text-[#e23744] tracking-tight">SteamyPot</Link>
            <nav className="hidden sm:flex gap-4 items-center">
              {user?.role === "user" && (
                <>
                  <NavLink to="/restaurants">Restaurants</NavLink>
                  <NavLink to="/orders">Orders</NavLink>
                  <NavLink to="/cart">Cart</NavLink>
                  <NavLink to="/profile">Profile</NavLink>
                </>
              )}
              {user?.role === "restaurant" && (
                <>
                  <NavLink to="/dashboard/restaurant">Restaurant</NavLink>
                  <NavLink to="/dashboard/restaurant/orders">Orders</NavLink>
                </>
              )}
              {user?.role === "admin" && <NavLink to="/dashboard/admin">Admin</NavLink>}
              {user?.role === "driver" && <NavLink to="/dashboard/driver">Driver</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="hidden sm:inline text-slate-700 font-medium">{user.username} ({user.role})</span>
                <Button variant="ghost" onClick={onLogout}>Logout</Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
                <Link to="/register"><Button>Get started</Button></Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
