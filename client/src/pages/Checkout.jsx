import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import TextInput from "../components/TextInput.jsx";
import Button from "../components/Button.jsx";

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ deliveryAddress: "", addressId: "", paymentMethod: "cod", offerCode: "" });
  const [pricing, setPricing] = useState({ subtotal: 0, deliveryFee: 0, discount: 0, total: 0 });
  const [validatingOffer, setValidatingOffer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [cartResp, addrResp] = await Promise.all([api.get("/cart"), api.get("/user/addresses")]);
        const cartData = cartResp.data;
        setCart(cartData);
        setAddresses(addrResp.data || []);

        if (cartData?.restaurantId) {
          try {
            const { data } = await api.get(`/catalog/restaurants/${cartData.restaurantId}/menu`);
            setRestaurant(data?.restaurant || null);
          } catch (_err) {
            setRestaurant(null);
          }
        }

        const subtotal = cartData?.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;
        setPricing((p) => ({ ...p, subtotal, total: subtotal }));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load checkout");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const deliveryFee = restaurant?.deliveryFee || 0;
    setPricing((p) => ({ ...p, deliveryFee, total: Math.max(0, p.subtotal + deliveryFee - p.discount) }));
  }, [restaurant]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const applyOffer = async () => {
    if (!form.offerCode) return;
    setValidatingOffer(true);
    try {
      const { data } = await api.post("/offers/validate", {
        code: form.offerCode,
        restaurantId: cart?.restaurantId,
        subtotal: pricing.subtotal
      });
      const discount = data.discount || 0;
      setPricing((p) => ({ ...p, discount, total: Math.max(0, p.subtotal + p.deliveryFee - discount) }));
      alert(`Offer applied. Discount: ₹${discount.toFixed(2)}`);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Invalid offer");
      setPricing((p) => ({ ...p, discount: 0, total: Math.max(0, p.subtotal + p.deliveryFee) }));
    } finally {
      setValidatingOffer(false);
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        paymentMethod: form.paymentMethod,
        offerCode: form.offerCode || undefined
      };
      if (form.addressId) {
        payload.addressId = form.addressId;
      } else {
        payload.deliveryAddress = form.deliveryAddress;
      }
      await api.post("/orders", payload);
      navigate("/orders", { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading checkout...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!cart?.items?.length) return <div>Your cart is empty.</div>;

  const formatMoney = (n) => `₹${(n || 0).toFixed(2)}`;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Delivery</h2>

        <div className="space-y-3">
          <div className="text-sm text-slate-700 font-semibold">Choose saved address</div>
          <div className="grid gap-2 md:grid-cols-2">
            {addresses.map((addr) => {
              const value = addr._id;
              const selected = form.addressId === value;
              return (
                <button
                  type="button"
                  key={addr._id}
                  onClick={() => setForm({ ...form, addressId: value, deliveryAddress: "" })}
                  className={`text-left rounded-lg border px-3 py-2 text-sm transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"}`}
                >
                  <div className="font-semibold flex items-center gap-2">
                    <span>{addr.label}</span>
                    {addr.isDefault ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Default</span> : null}
                  </div>
                  <div className="text-xs opacity-80">{[addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}</div>
                </button>
              );
            })}
            {!addresses.length && <div className="text-sm text-slate-500">No saved addresses. Add one below.</div>}
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={placeOrder}>
          <TextInput
            label="Or enter a new delivery address"
            name="deliveryAddress"
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value, addressId: "" })}
            placeholder="House, street, city"
          />

          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block mb-1">Promo code</label>
                <input
                  name="offerCode"
                  value={form.offerCode}
                  onChange={onChange}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
                  placeholder="e.g. SAVE50"
                />
              </div>
              <Button type="button" disabled={validatingOffer || !form.offerCode} onClick={applyOffer}>
                {validatingOffer ? "Applying..." : "Apply"}
              </Button>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Payment method
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={onChange}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition"
            >
              <option value="cod">Cash on delivery</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(pricing.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery fee</span><span>{formatMoney(pricing.deliveryFee)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(pricing.discount)}</span></div>
            <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatMoney(pricing.total)}</span></div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-lg font-bold">Pay: {formatMoney(pricing.total)}</div>
            <Button type="submit" disabled={submitting || (!form.addressId && !form.deliveryAddress)}>
              {submitting ? "Placing..." : "Place order"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Items</h2>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.foodId} className="flex justify-between text-sm">
              <div>{item.name} x {item.quantity}</div>
              <div>{formatMoney(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
