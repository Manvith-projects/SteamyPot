import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ["flat", "percent"], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null means platform-wide
    startsAt: { type: Date },
    endsAt: { type: Date },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

offerSchema.index({ restaurantId: 1, active: 1, startsAt: 1, endsAt: 1 });

export default mongoose.model("Offer", offerSchema);
