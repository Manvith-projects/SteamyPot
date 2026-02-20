import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    isOnline: { type: Boolean, default: false },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }
  },
  { timestamps: true }
);

driverSchema.index({ isOnline: 1, currentOrderId: 1 });

export default mongoose.model("Driver", driverSchema);
