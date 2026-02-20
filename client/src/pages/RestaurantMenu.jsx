import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client.js";
import Button from "../components/Button.jsx";

export default function RestaurantMenu() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [info, setInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(null);
  const [cartMap, setCartMap] = useState({});
  const [updatingQty, setUpdatingQty] = useState(null);

  const loadCart = async () => {
    try {
      const { data } = await api.get("/cart");
      const map = {};
      (data?.items || []).forEach((i) => {
        map[i.foodId] = i.quantity;
      });
      setCartMap(map);
    } catch (err) {
      // ignore cart load errors here; cart view will surface them
    }
  };

  const load = async () => {
    try {
      const [{ data: menuData }, { data: reviewData }] = await Promise.all([
        api.get(`/catalog/restaurants/${id}/menu`),
        api.get(`/reviews/restaurant/${id}`)
      ]);
      const payload = menuData?.data ? menuData : { data: menuData.data || [] };
      setItems(payload.data || []);
      setInfo(menuData?.restaurant || null);
      setReviews(reviewData || []);
      setError("");
      await loadCart();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addToCart = async (foodId) => {
    setAdding(foodId);
    try {
      await api.post("/cart/add", { foodId, quantity: 1 });
      setCartMap((prev) => ({ ...prev, [foodId]: (prev[foodId] || 0) + 1 }));
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to add to cart");
    } finally {
      setAdding(null);
    }
  };

  const updateQty = async (foodId, quantity) => {
    setUpdatingQty(foodId);
    try {
      if (quantity <= 0) {
        await api.delete(`/cart/item/${foodId}`);
        setCartMap((prev) => {
          const next = { ...prev };
          delete next[foodId];
          return next;
        });
      } else {
        await api.patch("/cart/item", { foodId, quantity });
        setCartMap((prev) => ({ ...prev, [foodId]: quantity }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to update quantity");
    } finally {
      setUpdatingQty(null);
    }
  };

  if (loading) return <div>Loading menu...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{info?.name || info?.username || "Restaurant"}</h1>
          <div className="text-sm text-slate-600 flex gap-3">
            <span>{info?.cuisines?.join(", ")}</span>
            <span>ETA {info?.etaMins || 30} mins</span>
            <span>Fee ₹{Number(info?.deliveryFee || 0).toFixed(2)}</span>
            <span>{(info?.ratingAvg || 0).toFixed(1)} ⭐ ({info?.ratingCount || 0})</span>
          </div>
          <div className="flex flex-wrap gap-1 text-xs text-slate-600">
            {info?.tags?.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-1">{t}</span>)}
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${info?.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
          {info?.isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex gap-4">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="h-24 w-24 rounded-lg object-cover border" />
            ) : (
              <div className="h-24 w-24 rounded-lg bg-slate-100 border flex items-center justify-center text-xs text-slate-500">No image</div>
            )}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-semibold">{item.name}</div>
                  <div className="text-sm text-slate-600">{item.description}</div>
                </div>
                <div className="text-brand-700 font-bold">₹{item.price?.toFixed(2)}</div>
              </div>
              <div className="flex justify-end">
                {cartMap[item._id] ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" disabled={updatingQty === item._id || cartMap[item._id] <= 1} onClick={() => updateQty(item._id, cartMap[item._id] - 1)}>-</Button>
                    <span className="w-8 text-center font-semibold">{cartMap[item._id]}</span>
                    <Button variant="ghost" disabled={updatingQty === item._id} onClick={() => updateQty(item._id, cartMap[item._id] + 1)}>+</Button>
                  </div>
                ) : (
                  <Button disabled={adding === item._id} onClick={() => addToCart(item._id)}>
                    {adding === item._id ? "Adding..." : "Add to cart"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Recent reviews</h2>
        {!reviews.length && <div className="text-sm text-slate-600">No reviews yet.</div>}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.rating} ⭐</span>
                <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment ? <div className="text-slate-700 mt-1">{r.comment}</div> : null}
              {r.reply ? <div className="mt-2 text-xs text-emerald-700">Reply: {r.reply}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
