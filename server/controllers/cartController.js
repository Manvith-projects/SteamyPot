import Cart from "../models/Cart.js";
import FoodItem from "../models/FoodItem.js";

const ensureCart = async (userId, restaurantId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, restaurantId, items: [] });
  }
  return cart;
};

export const addItemToCart = async (req, res) => {
  const { foodId, quantity = 1 } = req.body;
  if (!foodId) return res.status(400).json({ message: "foodId is required" });
  if (quantity <= 0) return res.status(400).json({ message: "quantity must be positive" });

  const food = await FoodItem.findById(foodId);
  if (!food) return res.status(404).json({ message: "Food item not found" });

  let cart = await Cart.findOne({ userId: req.user.id });

  if (cart && cart.restaurantId && cart.restaurantId.toString() !== food.restaurantId.toString() && cart.items.length > 0) {
    return res.status(400).json({ message: "Cart has items from another restaurant. Clear it before adding." });
  }

  if (!cart) {
    cart = await ensureCart(req.user.id, food.restaurantId);
  } else if (!cart.restaurantId) {
    cart.restaurantId = food.restaurantId;
  }

  const idx = cart.items.findIndex((i) => i.foodId.toString() === foodId);
  if (idx >= 0) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push({
      foodId,
      name: food.name,
      price: food.price,
      quantity
    });
  }

  await cart.save();
  res.status(200).json(cart);
};

export const updateCartItemQuantity = async (req, res) => {
  const { foodId, quantity } = req.body;
  if (!foodId) return res.status(400).json({ message: "foodId is required" });
  if (quantity === undefined) return res.status(400).json({ message: "quantity is required" });

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const idx = cart.items.findIndex((i) => i.foodId.toString() === foodId);
  if (idx === -1) return res.status(404).json({ message: "Item not in cart" });

  if (quantity <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity = quantity;
  }

  if (cart.items.length === 0) {
    cart.restaurantId = undefined;
  }

  await cart.save();
  res.json(cart);
};

export const removeItemFromCart = async (req, res) => {
  const { foodId } = req.params;
  if (!foodId) return res.status(400).json({ message: "foodId is required" });

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter((i) => i.foodId.toString() !== foodId);

  if (cart.items.length === 0) {
    cart.restaurantId = undefined;
  }

  await cart.save();
  res.json(cart);
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    return res.json({ items: [], restaurantId: null, total: 0 });
  }

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ ...cart.toObject(), total });
};
