import FoodItem from "../models/FoodItem.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

export const createFoodItem = async (req, res) => {
  const restaurant = await User.findById(req.user.id);
  if (!restaurant?.approval) {
    return res.status(403).json({ message: "Restaurant not approved" });
  }

  const { name, price, description, imageUrl } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: "Name and price are required" });
  }

  if (imageUrl && typeof imageUrl !== "string") {
    return res.status(400).json({ message: "imageUrl must be a string" });
  }

  const food = await FoodItem.create({
    name,
    price,
    description,
    imageUrl,
    restaurantId: req.user.id
  });

  res.status(201).json(food);
};

export const getMyMenu = async (req, res) => {
  const items = await FoodItem.find({ restaurantId: req.user.id }).sort({ createdAt: -1 });
  res.json(items);
};

export const updateFoodItem = async (req, res) => {
  const { id } = req.params;
  const restaurant = await User.findById(req.user.id);
  if (!restaurant?.approval) {
    return res.status(403).json({ message: "Restaurant not approved" });
  }

  const food = await FoodItem.findOne({ _id: id, restaurantId: req.user.id });
  if (!food) return res.status(404).json({ message: "Food item not found" });

  const allowed = ["name", "description", "price", "imageUrl"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) food[field] = req.body[field];
  });

  if (food.imageUrl && typeof food.imageUrl !== "string") {
    return res.status(400).json({ message: "imageUrl must be a string" });
  }

  await food.save();
  res.json(food);
};

export const deleteFoodItem = async (req, res) => {
  const { id } = req.params;
  const deleted = await FoodItem.findOneAndDelete({ _id: id, restaurantId: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Food item not found" });
  res.json({ message: "Food item removed" });
};

export const getOpenStatus = async (req, res) => {
  const restaurant = await User.findById(req.user.id).select("isOpen role approval");
  if (!restaurant || restaurant.role !== "restaurant") {
    return res.status(403).json({ message: "Restaurant not found" });
  }

  if (!restaurant.approval) {
    return res.status(403).json({ message: "Restaurant not approved" });
  }

  res.json({ isOpen: Boolean(restaurant.isOpen) });
};

export const setOpenStatus = async (req, res) => {
  const restaurant = await User.findById(req.user.id);
  if (!restaurant || restaurant.role !== "restaurant") {
    return res.status(403).json({ message: "Restaurant not found" });
  }

  if (!restaurant.approval) {
    return res.status(403).json({ message: "Restaurant not approved" });
  }

  if (typeof req.body.isOpen !== "boolean") {
    return res.status(400).json({ message: "isOpen boolean is required" });
  }

  restaurant.isOpen = req.body.isOpen;
  await restaurant.save();
  res.json({ message: "Status updated", isOpen: restaurant.isOpen });
};

export const getRestaurantMetrics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = { restaurantId: req.user.id };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const [aggStats] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        totalGMV: { $sum: "$total" },
        totalDiscount: { $sum: "$discount" },
        totalDeliveryFees: { $sum: "$deliveryFee" }
      }
    }
  ]);

  const [deliveryAgg] = await Order.aggregate([
    { $match: { ...match, deliveredAt: { $exists: true }, outForDeliveryAt: { $exists: true } } },
    { $project: { durationMinutes: { $divide: [{ $subtract: ["$deliveredAt", "$outForDeliveryAt"] }, 60000] } } },
    { $group: { _id: null, avgDeliveryMins: { $avg: "$durationMinutes" } } }
  ]);

  res.json({
    totalOrders: aggStats?.totalOrders || 0,
    deliveredOrders: aggStats?.deliveredOrders || 0,
    cancelledOrders: aggStats?.cancelledOrders || 0,
    totalGMV: aggStats?.totalGMV || 0,
    totalDiscount: aggStats?.totalDiscount || 0,
    totalDeliveryFees: aggStats?.totalDeliveryFees || 0,
    avgDeliveryMins: deliveryAgg?.avgDeliveryMins || 0
  });
};
