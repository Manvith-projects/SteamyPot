import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import Button from "../components/Button.jsx";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setCart(data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (foodId, quantity) => {
    setUpdating(true);
    try {
      await api.patch("/cart/item", { foodId, quantity });
      await loadCart();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (foodId) => {
    setUpdating(true);
    try {
      await api.delete(`/cart/item/${foodId}`);
      await loadCart();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Remove failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading cart...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const items = cart?.items || [];
  const total = cart?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Link to="/checkout"><Button disabled={!items.length}>Checkout</Button></Link>
      </div>
      {!items.length && <div className="text-slate-600">Cart is empty.</div>}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.foodId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-slate-600">₹{item.price?.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={updating || item.quantity <= 1} onClick={() => updateQty(item.foodId, item.quantity - 1)}>-</Button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <Button variant="ghost" disabled={updating} onClick={() => updateQty(item.foodId, item.quantity + 1)}>+</Button>
              <Button variant="ghost" disabled={updating} onClick={() => removeItem(item.foodId)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-right text-lg font-bold">Total: ₹{total.toFixed(2)}</div>
    </div>
  );
}
