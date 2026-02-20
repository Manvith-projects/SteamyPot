import Driver from "../models/Driver.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";
import { ORDER_STATUSES, canTransition, isTerminalStatus } from "../utils/orderStatus.js";
import { findAvailableDriver } from "../utils/driverFinder.js";
import { applyStatusTimestamps } from "../utils/statusTimestamps.js";
const emitOrderUpdate = (order) => {
  const io = getIO();
  if (!io) return;
  const userRoom = order.userId ? `user:${order.userId.toString()}` : null;
  const restaurantRoom = order.restaurantId ? `user:${order.restaurantId.toString()}` : null;
  const driverRoom = order.driverId ? `user:${order.driverId.toString()}` : null;
  [userRoom, restaurantRoom, driverRoom].filter(Boolean).forEach((room) => io.to(room).emit("order:update", order));
};

export const setOnline = async (req, res) => {
  const { isOnline } = req.body;
  if (typeof isOnline !== "boolean") return res.status(400).json({ message: "isOnline boolean is required" });

  const driver = await Driver.findOneAndUpdate(
    { userId: req.user.id },
    { $set: { isOnline } },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(req.user.id, { $set: { isOnline } });

  res.json({ isOnline: driver.isOnline });
};

export const getAssignedOrders = async (req, res) => {
  const orders = await Order.find({ driverId: req.user.id })
    .sort({ createdAt: -1 })
    .populate("restaurantId", "username email")
    .populate("userId", "username email");
  res.json(orders);
};

export const listAvailableDrivers = async (req, res) => {
  if (!["restaurant", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const driverDocs = await Driver.find({ isOnline: true, $or: [{ currentOrderId: null }, { currentOrderId: { $exists: false } }] })
    .populate("userId", "username email isOnline isBlocked");

  const drivers = driverDocs
    .filter((d) => d.userId && d.userId.isOnline && !d.userId.isBlocked)
    .map((d) => ({ id: d.userId._id, username: d.userId.username, email: d.userId.email, isOnline: d.userId.isOnline }));

  res.json(drivers);
};

export const driverUpdateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!ORDER_STATUSES.includes(status) || !["out_for_delivery", "delivered"].includes(status)) {
    return res.status(400).json({ message: "Invalid status for driver" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!order.driverId || order.driverId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not assigned to this order" });
  }

  if (order.driverAcceptance !== "accepted") {
    return res.status(400).json({ message: "Accept the assignment before updating status" });
  }

  if (isTerminalStatus(order.status)) {
    return res.status(400).json({ message: "Order is already closed" });
  }

  if (order.driverAcceptance === "declined") {
    return res.status(400).json({ message: "Assignment declined" });
  }

  if (!canTransition(order.status, status)) {
    return res.status(400).json({ message: "Status transition not allowed" });
  }

  order.status = status;
  order.statusHistory.push({ status, changedAt: new Date(), note });

  if (status === "delivered" && order.paymentMethod === "cod" && order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.paidAt = new Date();
  }

   applyStatusTimestamps(order, status);

  await order.save();

  const nextState = status === "delivered" ? { currentOrderId: null, isOnline: true } : { currentOrderId: order._id };
  await Driver.findOneAndUpdate(
    { userId: req.user.id },
    { $set: nextState },
    { upsert: true }
  );

  emitOrderUpdate(order);
  res.json(order);
};

export const driverAcceptAssignment = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!order.driverId || order.driverId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not assigned to this order" });
  }
  if (order.driverAcceptance && order.driverAcceptance !== "pending") {
    return res.status(400).json({ message: "Assignment already processed" });
  }
  order.driverAcceptance = "accepted";
  order.statusHistory.push({ status: order.status, changedAt: new Date(), note: "Driver accepted assignment" });
  await order.save();
  emitOrderUpdate(order);
  res.json(order);
};

export const driverDeclineAssignment = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!order.driverId || order.driverId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not assigned to this order" });
  }
  if (order.driverAcceptance && order.driverAcceptance !== "pending") {
    return res.status(400).json({ message: "Assignment already processed" });
  }
  order.driverAcceptance = "declined";
  order.statusHistory.push({ status: order.status, changedAt: new Date(), note: "Driver declined assignment" });
  const driverId = order.driverId;
  order.driverId = undefined;
  await order.save();

  await Driver.findOneAndUpdate(
    { userId: driverId },
    { $set: { currentOrderId: null } },
    { upsert: true }
  );

  // auto-reassign to an available online driver (excluding the decliner)
  const fallback = await findAvailableDriver({ excludeDriverIds: [driverId] });

  if (fallback) {
    order.driverId = fallback._id;
    order.driverAcceptance = "pending";
    order.statusHistory.push({ status: order.status, changedAt: new Date(), note: `Reassigned to driver ${fallback.username}` });
    await order.save();
    await Driver.findOneAndUpdate(
      { userId: fallback._id },
      { $set: { currentOrderId: order._id, isOnline: true } },
      { upsert: true }
    );
  }

  emitOrderUpdate(order);
  res.json(order);
};
