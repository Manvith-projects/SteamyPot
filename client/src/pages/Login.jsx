import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import TextInput from "../components/TextInput.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      const token = data?.token;
      if (token) {
        login({ token, user: data.user });
        const role = data?.user?.role;
        if (role === "admin") navigate("/dashboard/admin", { replace: true });
        else if (role === "restaurant") navigate("/dashboard/restaurant", { replace: true });
        else navigate("/restaurants", { replace: true });
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Steamy Pot</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            required
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            required
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
