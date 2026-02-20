import { useEffect, useState } from "react";
import api from "../api/client.js";
import Button from "../components/Button.jsx";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addrForm, setAddrForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", zip: "", isDefault: false });
  const [savingAddr, setSavingAddr] = useState(false);

  const load = async () => {
    try {
      const [{ data: profileData }, { data: addrData }] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/addresses")
      ]);
      setProfile(profileData);
      setAddresses(addrData || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAddrChange = (e) => setAddrForm({ ...addrForm, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      await api.post("/user/addresses", addrForm);
      setAddrForm({ label: "Home", line1: "", line2: "", city: "", state: "", zip: "", isDefault: false });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to save address");
    } finally {
      setSavingAddr(false);
    }
  };

  const setDefault = async (id) => {
    try {
      await api.patch(`/user/addresses/${id}`, { isDefault: true });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to set default");
    }
  };

  const removeAddress = async (id) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await api.delete(`/user/addresses/${id}`);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to remove address");
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="font-semibold">{profile.username}</div>
        <div className="text-sm text-slate-600">{profile.email}</div>
        <div className="text-sm text-slate-600">Role: {profile.role}</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Addresses</h2>
        {!addresses.length && <div className="text-sm text-slate-600">No addresses yet.</div>}
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className="rounded-lg border border-slate-200 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{a.label}</span>
                {a.isDefault ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Default</span> : null}
              </div>
              <div className="text-slate-700">{[a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(", ")}</div>
              <div className="flex gap-2 pt-1">
                {!a.isDefault && <Button size="sm" variant="ghost" onClick={() => setDefault(a._id)}>Make default</Button>}
                <Button size="sm" variant="ghost" onClick={() => removeAddress(a._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={saveAddress}>
          <input name="label" value={addrForm.label} onChange={onAddrChange} placeholder="Label" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="line1" value={addrForm.line1} onChange={onAddrChange} placeholder="Address line 1" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
          <input name="line2" value={addrForm.line2} onChange={onAddrChange} placeholder="Address line 2" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="city" value={addrForm.city} onChange={onAddrChange} placeholder="City" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
          <input name="state" value={addrForm.state} onChange={onAddrChange} placeholder="State" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input name="zip" value={addrForm.zip} onChange={onAddrChange} placeholder="ZIP" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDefault" checked={addrForm.isDefault} onChange={onAddrChange} />
            Set as default
          </label>
          <Button type="submit" disabled={savingAddr}>{savingAddr ? "Saving..." : "Add address"}</Button>
        </form>
      </div>
    </div>
  );
}
