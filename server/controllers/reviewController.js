import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const recalcRatings = async (restaurantId) => {
  const agg = await Review.aggregate([
    { $match: { restaurantId: restaurantId } },
    { $group: { _id: "$restaurantId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await User.findByIdAndUpdate(restaurantId, { ratingAvg: avg, ratingCount: count });
};

export const createReview = async (req, res) => {
  const { orderId, rating, comment } = req.body;
  if (!orderId || !rating) return res.status(400).json({ message: "orderId and rating are required" });
  if (rating < 1 || rating > 5) return res.status(400).json({ message: "rating must be 1-5" });

  const order = await Order.findOne({ _id: orderId, userId: req.user.id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "delivered") return res.status(400).json({ message: "You can review only delivered orders" });

  const existing = await Review.findOne({ orderId, userId: req.user.id });
  if (existing) return res.status(400).json({ message: "You already reviewed this order" });

  const review = await Review.create({
    userId: req.user.id,
    restaurantId: order.restaurantId,
    orderId,
    rating,
    comment
  });

  await recalcRatings(order.restaurantId);

  res.status(201).json(review);
};

export const listRestaurantReviews = async (req, res) => {
  const { restaurantId } = req.params;
  const reviews = await Review.find({ restaurantId }).sort({ createdAt: -1 }).limit(100);
  res.json(reviews);
};

export const replyToReview = async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  if (req.user.role !== "restaurant" || review.restaurantId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  review.reply = req.body.reply || "";
  await review.save();
  res.json(review);
};
