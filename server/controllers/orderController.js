import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Address from "../models/Address.js";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
import { validateOfferCode } from "./offerController.js";
import { getIO } from "../socket.js";
import { ORDER_STATUSES, canTransition, isTerminalStatus } from "../utils/orderStatus.js";
import { releaseDriver } from "../utils/driverAssignment.js";
import { findAvailableDriver } from "../utils/driverFinder.js";
import { applyStatusTimestamps } from "../utils/statusTimestamps.js";

const USER_CANCELLABLE_STATUSES = ["placed", "confirmed"];
// Restaurants can drive the order through all non-user states; guard with canTransition
const RESTAURANT_ALLOWED_STATUSES = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
const ALLOWED_PAYMENTS = ["cod", "card", "upi"];

const emitOrderUpdate = (order) => {
  const io = getIO();
  if (!io) return;
  const userRoom = order.userId ? `user:${order.userId.toString()}` : null;
  const restaurantRoom = order.restaurantId ? `user:${order.restaurantId.toString()}` : null;
  const driverRoom = order.driverId ? `user:${order.driverId.toString()}` : null;
  [userRoom, restaurantRoom, driverRoom].filter(Boolean).forEach((room) => {
    io.to(room).emit("order:update", order);
  });
};

export const placeOrder = async (req, res) => {
  const { deliveryAddress, addressId, paymentMethod = "cod", offerCode } = req.body;

  if (!deliveryAddress && !addressId) {
    return res.status(400).json({ message: "deliveryAddress or addressId is required" });
  }

  if (!ALLOWED_PAYMENTS.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid paymentMethod" });
  }

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // derive restaurantId if missing on cart
  if (!cart.restaurantId && cart.items.length) {
    cart.restaurantId = cart.items[0].restaurantId || undefined;
    await cart.save();
  }

  const restaurant = cart.restaurantId ? await User.findById(cart.restaurantId) : null;
  if (!restaurant || restaurant.role !== "restaurant") {
    return res.status(400).json({ message: "Restaurant unavailable" });
  }
  if (!restaurant.approval || restaurant.isBlocked) {
    return res.status(403).json({ message: "Restaurant not available" });
  }
  if (restaurant.isOpen === false) {
    return res.status(400).json({ message: "Restaurant is closed" });
  }

  let resolvedAddress;
  try {
    resolvedAddress = deliveryAddress
      ? deliveryAddress
      : await (async () => {
          const addr = await Address.findOne({ _id: addressId, userId: req.user.id });
          if (!addr) throw new Error("Address not found");
          return [addr.label, addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
        })();
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = restaurant.deliveryFee || 0;

  let discount = 0;
  let appliedOffer = null;
  if (offerCode) {
    try {
      const { offer, discount: d } = await validateOfferCode({ code: offerCode, restaurantId: restaurant._id, subtotal });
      discount = d;
      appliedOffer = offer.code;
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);

  const order = await Order.create({
    userId: req.user.id,
    restaurantId: cart.restaurantId,
    items: cart.items.map((i) => ({ foodId: i.foodId, name: i.name, quantity: i.quantity, price: i.price })),
    subtotal,
    deliveryFee,
    discount,
    total,
    offerCode: appliedOffer,
    deliveryAddress: resolvedAddress,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    status: "placed",
    statusHistory: [{ status: "placed", changedAt: new Date() }]
  });

  cart.items = [];
  cart.restaurantId = undefined;
  await cart.save();

  emitOrderUpdate(order);
  res.status(201).json(order);
};

export const getUserOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate("driverId", "username email");
  res.json(orders);
};

export const getRestaurantOrders = async (req, res) => {
  if (req.user.role !== "restaurant") {
    return res.status(403).json({ message: "Not authorized" });
  }
  const orders = await Order.find({ restaurantId: req.user.id })
    .sort({ createdAt: -1 })
    .populate("driverId", "username email")
    .populate("userId", "username email");
  res.json(orders);
};

export const assignDriver = async (req, res) => {
  const { id } = req.params;
  const { driverId, note, autoAssign } = req.body;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isRestaurant = req.user.role === "restaurant";
  const isAdmin = req.user.role === "admin";
  if (!isRestaurant && !isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }
  if (isRestaurant && order.restaurantId?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Cannot assign driver for other restaurants" });
  }

  if (["cancelled", "delivered"].includes(order.status)) {
    return res.status(400).json({ message: "Order is already closed" });
  }

  const assignableStatuses = ["placed", "confirmed", "preparing"];
  if (!assignableStatuses.includes(order.status)) {
    return res.status(400).json({ message: "Order not in an assignable state" });
  }

  let targetDriverId = driverId;

  if (!targetDriverId && autoAssign) {
    const available = await findAvailableDriver();
    if (!available) {
      return res.status(400).json({ message: "No available drivers" });
    }
    targetDriverId = available._id;
  }

  if (!targetDriverId) {
    return res.status(400).json({ message: "driverId is required" });
  }

  const driverUser = await User.findOne({ _id: targetDriverId, role: "driver" });
  if (!driverUser) return res.status(404).json({ message: "Driver not found" });
  if (!driverUser.isOnline) return res.status(400).json({ message: "Driver is offline" });
  if (driverUser.isBlocked) return res.status(400).json({ message: "Driver is blocked" });

  const driverProfile = await Driver.findOne({ userId: targetDriverId });
  if (driverProfile?.currentOrderId && driverProfile.currentOrderId.toString() !== order._id.toString()) {
    return res.status(400).json({ message: "Driver is busy" });
  }

  order.driverId = targetDriverId;
  order.driverAcceptance = "pending";
  if (order.status === "placed") {
    order.status = "confirmed";
    order.statusHistory.push({ status: "confirmed", changedAt: new Date(), note: "Auto-confirmed on assignment" });
    applyStatusTimestamps(order, "confirmed");
  }
  order.statusHistory.push({ status: order.status, changedAt: new Date(), note: note || `Driver assigned: ${driverUser.username}` });
  await order.save();

  await Driver.findOneAndUpdate(
    { userId: targetDriverId },
    { $set: { currentOrderId: order._id, isOnline: true } },
    { upsert: true }
  );

  emitOrderUpdate(order);
  res.json(order);
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isRestaurant = req.user.role === "restaurant";
  const isAdmin = req.user.role === "admin";
  const isUser = req.user.role === "user";

  if (isRestaurant && order.restaurantId?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Cannot modify orders from other restaurants" });
  }

  if (isUser) {
    if (status !== "cancelled") return res.status(403).json({ message: "Users can only cancel orders" });
    if (!USER_CANCELLABLE_STATUSES.includes(order.status) || !canTransition(order.status, "cancelled")) {
      return res.status(400).json({ message: "Order can no longer be cancelled" });
    }
    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", changedAt: new Date(), note: note || "Cancelled by user" });
    applyStatusTimestamps(order, "cancelled");
    await order.save();
    await releaseDriver(order);
    emitOrderUpdate(order);
    return res.json(order);
  }

  if (!isRestaurant && !isAdmin) {
    return res.status(403).json({ message: "Not authorized to update orders" });
  }
  if (isAdmin) {
    return res.status(403).json({ message: "Admins can view but not modify order status" });
  }

  if (!RESTAURANT_ALLOWED_STATUSES.includes(status)) {
    return res.status(403).json({ message: "Status change not allowed for restaurant" });
  }

  if (isTerminalStatus(order.status)) {
    return res.status(400).json({ message: "Order already completed" });
  }

  if (!canTransition(order.status, status)) {
    return res.status(400).json({ message: "Status transition not allowed" });
  }

  if (status === "cancelled") {
    if (!USER_CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({ message: "Order can no longer be cancelled" });
    }
    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", changedAt: new Date(), note: note || "Cancelled by restaurant" });
    applyStatusTimestamps(order, "cancelled");
    await order.save();
    await releaseDriver(order);
    emitOrderUpdate(order);
    return res.json(order);
  }

  order.status = status;
  order.statusHistory.push({ status, changedAt: new Date(), note });
  applyStatusTimestamps(order, status);
  await order.save();
  emitOrderUpdate(order);
  res.json(order);
};

export const restaurantAcceptOrder = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.user.role !== "restaurant" || order.restaurantId?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }
  if (isTerminalStatus(order.status)) {
    return res.status(400).json({ message: "Order already closed" });
  }
  if (order.status !== "placed") {
    return res.status(400).json({ message: "Order already processed" });
  }

  order.status = "confirmed";
  applyStatusTimestamps(order, "confirmed");
  order.statusHistory.push({ status: "confirmed", changedAt: new Date(), note: "Accepted by restaurant" });
  await order.save();
  emitOrderUpdate(order);
  res.json(order);
};

export const restaurantRejectOrder = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.user.role !== "restaurant" || order.restaurantId?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }
  if (isTerminalStatus(order.status)) {
    return res.status(400).json({ message: "Order already closed" });
  }
  if (!USER_CANCELLABLE_STATUSES.includes(order.status)) {
    return res.status(400).json({ message: "Order can no longer be cancelled" });
  }

  order.status = "cancelled";
  applyStatusTimestamps(order, "cancelled");
  order.statusHistory.push({ status: "cancelled", changedAt: new Date(), note: note || "Rejected by restaurant" });
  await order.save();
  await releaseDriver(order);
  emitOrderUpdate(order);
  res.json(order);
};
