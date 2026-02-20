import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      required: true
    },
    changedAt: { type: Date, default: Date.now },
    note: { type: String }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    offerCode: { type: String },
    deliveryAddress: { type: String, required: true },
    paymentMethod: { type: String, enum: ["cod", "card", "upi"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paidAt: { type: Date },
    paymentReference: { type: String },
    replacesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    supportNote: { type: String },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driverAcceptance: { type: String, enum: ["pending", "accepted", "declined"] },
    status: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "placed"
    },
    confirmedAt: { type: Date },
    preparingAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: "placed", changedAt: new Date() }]
    }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ driverId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ driverId: 1, status: 1 });

export default mongoose.model("Order", orderSchema);
