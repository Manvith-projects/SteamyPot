import User from "../models/User.js";
import Order from "../models/Order.js";
import FoodItem from "../models/FoodItem.js";
import { ORDER_STATUSES } from "../utils/orderStatus.js";
const ALLOWED_ROLES = ["user", "restaurant", "driver", "admin"];

export const listUsers = async (req, res) => {
  const { limit, skip, page } = req.pagination || {};
  const { search, role, blocked, approval } = req.query;

  const filter = {};
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ username: regex }, { email: regex }];
  }
  if (role && ALLOWED_ROLES.includes(role)) filter.role = role;
  if (blocked === "true") filter.isBlocked = true;
  if (blocked === "false") filter.isBlocked = false;
  if (approval === "true") filter.approval = true;
  if (approval === "false") filter.approval = false;

  const query = User.find(filter)
    .select("username email role approval createdAt isBlocked")
    .sort({ createdAt: -1 });
  if (limit !== undefined) query.limit(limit).skip(skip);
  const [data, total] = await Promise.all([query, User.countDocuments(filter)]);
  res.json({ data, page: page || 1, limit, total });
};

export const listRestaurants = async (req, res) => {
  const { limit, skip, page } = req.pagination || {};
  const query = User.find({ role: "restaurant" }).select("username email approval createdAt isBlocked").sort({ createdAt: -1 });
  if (limit !== undefined) query.limit(limit).skip(skip);
  const [data, total] = await Promise.all([query, User.countDocuments({ role: "restaurant" })]);
  res.json({ data, page: page || 1, limit, total });
};

export const approveRestaurant = async (req, res) => {
  const { id } = req.params;
  const restaurant = await User.findOne({ _id: id, role: "restaurant" });
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  restaurant.approval = true;
  await restaurant.save();
  res.json({ message: "Restaurant approved" });
};

export const listAllOrders = async (req, res) => {
  const { limit, skip, page } = req.pagination || {};
  const { status, userId, restaurantId, driverId, search, from, to, paymentStatus } = req.query;

  const filter = {};
  if (status && ORDER_STATUSES.includes(status)) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (userId) filter.userId = userId;
  if (restaurantId) filter.restaurantId = restaurantId;
  if (driverId) filter.driverId = driverId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ offerCode: regex }, { paymentReference: regex }, { deliveryAddress: regex }];
    if (search.length === 24) {
      filter.$or.push({ _id: search });
    }
  }

  const query = Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "username email")
    .populate("restaurantId", "username email")
    .populate("driverId", "username email");
  if (limit !== undefined) query.limit(limit).skip(skip);
  const [data, total] = await Promise.all([query, Order.countDocuments(filter)]);
  res.json({ data, page: page || 1, limit, total });
};

export const blockUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBlocked = true;
  if (user.role === "driver") {
    user.isOnline = false;
  }
  await user.save();
  res.json({ message: "User blocked" });
};

export const unblockUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBlocked = false;
  await user.save();
  res.json({ message: "User unblocked" });
};

export const listAllFood = async (req, res) => {
  const { limit, skip, page } = req.pagination || {};
  const query = FoodItem.find();
  if (limit !== undefined) query.limit(limit).skip(skip);
  const items = await query.sort({ createdAt: -1 });
  const total = await FoodItem.countDocuments();
  res.json({ data: items, page: page || 1, limit, total });
};

export const adminUpdateFood = async (req, res) => {
  const { id } = req.params;
  const food = await FoodItem.findById(id);
  if (!food) return res.status(404).json({ message: "Food item not found" });

  ["name", "description", "price"].forEach((field) => {
    if (req.body[field] !== undefined) food[field] = req.body[field];
  });

  await food.save();
  res.json(food);
};

export const adminDeleteFood = async (req, res) => {
  const { id } = req.params;
  const deleted = await FoodItem.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Food item not found" });
  res.json({ message: "Food item removed" });
};

export const adminReplaceOrder = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};

  const original = await Order.findById(id);
  if (!original) return res.status(404).json({ message: "Order not found" });

  const replacement = await Order.create({
    userId: original.userId,
    restaurantId: original.restaurantId,
    items: original.items,
    subtotal: original.subtotal,
    deliveryFee: original.deliveryFee,
    discount: original.discount,
    total: original.total,
    offerCode: original.offerCode,
    deliveryAddress: original.deliveryAddress,
    paymentMethod: original.paymentMethod,
    paymentStatus: "pending",
    driverId: undefined,
    driverAcceptance: undefined,
    status: "placed",
    statusHistory: [{ status: "placed", changedAt: new Date(), note: `Replacement for ${id}` }],
    replacesOrderId: original._id,
    supportNote: note
  });

  res.status(201).json(replacement);
};

export const setUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, approval } = req.body;

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = role;
  if (role === "restaurant" && approval !== undefined) {
    user.approval = Boolean(approval);
  }
  if (role !== "restaurant") {
    user.approval = false;
  }

  await user.save();
  res.json({ message: "Role updated", user: { id: user._id, role: user.role, approval: user.approval } });
};

export const getPlatformMetrics = async (req, res) => {
  const { startDate, endDate, topLimit = 5 } = req.query;
  const match = {};
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

  const limit = Number(topLimit) || 5;
  const topRestaurants = await Order.aggregate([
    { $match: match },
    { $group: { _id: "$restaurantId", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "restaurant"
      }
    },
    { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        restaurantId: "$_id",
        revenue: 1,
        orders: 1,
        name: "$restaurant.username",
        email: "$restaurant.email"
      }
    }
  ]);

  res.json({
    totalOrders: aggStats?.totalOrders || 0,
    deliveredOrders: aggStats?.deliveredOrders || 0,
    cancelledOrders: aggStats?.cancelledOrders || 0,
    totalGMV: aggStats?.totalGMV || 0,
    totalDiscount: aggStats?.totalDiscount || 0,
    totalDeliveryFees: aggStats?.totalDeliveryFees || 0,
    avgDeliveryMins: deliveryAgg?.avgDeliveryMins || 0,
    topRestaurants
  });
};
