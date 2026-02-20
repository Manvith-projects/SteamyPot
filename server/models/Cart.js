import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: { type: [cartItemSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
