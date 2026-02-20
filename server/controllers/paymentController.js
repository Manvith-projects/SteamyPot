import Order from "../models/Order.js";
import { ORDER_STATUSES, isTerminalStatus } from "../utils/orderStatus.js";

const ensureOrderAccessible = (order, userId) => {
  if (!order) return { status: 404, message: "Order not found" };
  if (order.userId.toString() !== userId) return { status: 403, message: "Not authorized" };
  if (isTerminalStatus(order.status)) return { status: 400, message: "Order already closed" };
  return null;
};

export const confirmPayment = async (req, res) => {
  const { orderId } = req.params;
  const { reference } = req.body;

  const order = await Order.findById(orderId);
  const guard = ensureOrderAccessible(order, req.user.id);
  if (guard) return res.status(guard.status).json({ message: guard.message });

  if (order.paymentMethod === "cod") {
    return res.status(400).json({ message: "COD payments are collected on delivery" });
  }

  order.paymentStatus = "paid";
  order.paidAt = new Date();
  order.paymentReference = reference || order.paymentReference;
  await order.save();

  res.json({ message: "Payment confirmed", paymentStatus: order.paymentStatus, paidAt: order.paidAt, reference: order.paymentReference });
};

export const failPayment = async (req, res) => {
  const { orderId } = req.params;
  const { reference } = req.body;

  const order = await Order.findById(orderId);
  const guard = ensureOrderAccessible(order, req.user.id);
  if (guard) return res.status(guard.status).json({ message: guard.message });

  if (order.paymentMethod === "cod") {
    return res.status(400).json({ message: "COD payments are collected on delivery" });
  }

  order.paymentStatus = "failed";
  order.paymentReference = reference || order.paymentReference;
  await order.save();

  res.json({ message: "Payment marked failed", paymentStatus: order.paymentStatus, reference: order.paymentReference });
};

export const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).select("paymentStatus paymentMethod paidAt paymentReference userId status");
  const guard = ensureOrderAccessible(order, req.user.id);
  if (guard) return res.status(guard.status).json({ message: guard.message });
  res.json({ paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, paidAt: order.paidAt, reference: order.paymentReference, orderStatus: order.status });
};
