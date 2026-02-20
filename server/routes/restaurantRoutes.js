import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isRestaurant } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createFoodItem, getMyMenu, updateFoodItem, deleteFoodItem, setOpenStatus, getRestaurantMetrics, getOpenStatus } from "../controllers/restaurantController.js";

const router = express.Router();

router.post("/food", protect, isRestaurant, asyncHandler(createFoodItem));
router.get("/menu", protect, isRestaurant, asyncHandler(getMyMenu));
router.patch("/food/:id", protect, isRestaurant, asyncHandler(updateFoodItem));
router.delete("/food/:id", protect, isRestaurant, asyncHandler(deleteFoodItem));
router.get("/open", protect, isRestaurant, asyncHandler(getOpenStatus));
router.patch("/open", protect, isRestaurant, asyncHandler(setOpenStatus));
router.get("/metrics", protect, isRestaurant, asyncHandler(getRestaurantMetrics));

export default router;
