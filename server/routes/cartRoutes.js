import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { addItemToCart, updateCartItemQuantity, removeItemFromCart, getCart } from "../controllers/cartController.js";
import { validateBody } from "../middleware/validate.js";
import { isUser } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/add", protect, isUser, validateBody(["foodId"]), asyncHandler(addItemToCart));
router.patch("/item", protect, isUser, validateBody(["foodId", "quantity"]), asyncHandler(updateCartItemQuantity));
router.delete("/item/:foodId", protect, isUser, asyncHandler(removeItemFromCart));
router.get("/", protect, isUser, asyncHandler(getCart));

export default router;
