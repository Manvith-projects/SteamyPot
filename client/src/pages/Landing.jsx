import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 text-slate-900">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-bold">Steamy Pot</div>
        <div className="flex gap-3">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/register"><Button>Get started</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">Late-night cravings solved</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Order comfort food anytime with Steamy Pot</h1>
          <p className="text-lg text-slate-600">Browse approved restaurants, fill your cart, and check out fast. Restaurants manage menus, admins keep things in check.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"><Button>Start ordering</Button></Link>
            <Link to="/login"><Button variant="ghost">I already have an account</Button></Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-slate-600 pt-4">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="text-lg font-semibold text-slate-900">1. Discover</div>
              <p>Find approved restaurants and menus.</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="text-lg font-semibold text-slate-900">2. Cart</div>
              <p>Add dishes, adjust quantities, checkout.</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="text-lg font-semibold text-slate-900">3. Track</div>
              <p>Place orders and monitor status.</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-brand-100 opacity-50 blur-3xl" aria-hidden />
          <div className="relative rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-sm text-slate-500">Featured</div>
                <div className="text-xl font-semibold">Midnight Comfort</div>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Open</span>
            </div>
            <div className="space-y-3">
              {["Chicken Noodle Soup", "Garlic Bread", "Brownie Sundae"].map((item, idx) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                  <div className="text-sm font-medium text-slate-900">{item}</div>
                  <div className="text-sm text-slate-600">₹{(8 + idx * 2).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Cart total</div>
                <div className="text-2xl font-bold text-slate-900">₹18.00</div>
              </div>
              <Link to="/register"><Button>Checkout</Button></Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
