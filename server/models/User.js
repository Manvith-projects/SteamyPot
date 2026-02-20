import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "restaurant", "driver"],
      default: "user"
    },
    approval: { type: Boolean, default: false }, // for restaurants
    cuisines: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    deliveryFee: { type: Number, default: 0 },
    etaMins: { type: Number, default: 30 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false }, // for drivers
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
