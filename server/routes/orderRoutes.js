import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
	placeOrder,
	getUserOrders,
	getRestaurantOrders,
	updateOrderStatus,
	assignDriver,
	restaurantAcceptOrder,
	restaurantRejectOrder
} from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { isUser, isRestaurant, isAdminOrRestaurant } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, isUser, asyncHandler(placeOrder));
router.get("/", protect, isUser, asyncHandler(getUserOrders));
router.get("/restaurant", protect, isRestaurant, asyncHandler(getRestaurantOrders));
router.post("/:id/restaurant/accept", protect, isRestaurant, asyncHandler(restaurantAcceptOrder));
router.post("/:id/restaurant/reject", protect, isRestaurant, asyncHandler(restaurantRejectOrder));
router.patch("/:id/assign-driver", protect, isAdminOrRestaurant, asyncHandler(assignDriver));
router.patch("/:id/status", protect, asyncHandler(updateOrderStatus));

export default router;
