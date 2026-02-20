import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import TextInput from "../components/TextInput.jsx";
import Button from "../components/Button.jsx";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-500">Join Steamy Pot</p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextInput
            label="Username"
            name="username"
            value={form.username}
            onChange={onChange}
            required
          />
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
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            required
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Role
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            >
              <option value="user">User</option>
              <option value="restaurant">Restaurant</option>
            </select>
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-center text-slate-600">
          Already have an account? <Link className="text-brand-700 font-semibold" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
