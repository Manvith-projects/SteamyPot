import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

foodItemSchema.index({ restaurantId: 1, createdAt: -1 });
foodItemSchema.index({ name: 1, restaurantId: 1 });

export default mongoose.model("FoodItem", foodItemSchema);
