import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { withPagination } from "../middleware/pagination.js";
import {
	listUsers,
	listRestaurants,
	approveRestaurant,
	listAllOrders,
	listAllFood,
	adminUpdateFood,
	adminDeleteFood,
	setUserRole,
	blockUser,
	unblockUser,
	adminReplaceOrder,
	getPlatformMetrics
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", protect, isAdmin, withPagination, asyncHandler(listUsers));
router.get("/restaurants", protect, isAdmin, withPagination, asyncHandler(listRestaurants));
router.patch("/restaurants/:id/approve", protect, isAdmin, asyncHandler(approveRestaurant));
router.get("/orders", protect, isAdmin, withPagination, asyncHandler(listAllOrders));
router.post("/orders/:id/replace", protect, isAdmin, asyncHandler(adminReplaceOrder));
router.get("/food", protect, isAdmin, withPagination, asyncHandler(listAllFood));
router.patch("/food/:id", protect, isAdmin, asyncHandler(adminUpdateFood));
router.delete("/food/:id", protect, isAdmin, asyncHandler(adminDeleteFood));
router.patch("/users/:id/role", protect, isAdmin, asyncHandler(setUserRole));
router.patch("/users/:id/block", protect, isAdmin, asyncHandler(blockUser));
router.patch("/users/:id/unblock", protect, isAdmin, asyncHandler(unblockUser));
router.get("/metrics", protect, isAdmin, asyncHandler(getPlatformMetrics));

export default router;
