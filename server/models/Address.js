import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    zip: { type: String },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1, isDefault: -1 });

export default mongoose.model("Address", addressSchema);
