import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    reply: { type: String, trim: true }
  },
  { timestamps: true }
);

reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, restaurantId: 1 }, { unique: false });

export default mongoose.model("Review", reviewSchema);
