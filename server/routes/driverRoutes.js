import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isDriver, isAdminOrRestaurant } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
	setOnline,
	getAssignedOrders,
	driverUpdateStatus,
	listAvailableDrivers,
	driverAcceptAssignment,
	driverDeclineAssignment
} from "../controllers/driverController.js";

const router = express.Router();

router.patch("/online", protect, isDriver, asyncHandler(setOnline));
router.get("/available", protect, isAdminOrRestaurant, asyncHandler(listAvailableDrivers));
router.get("/orders", protect, isDriver, asyncHandler(getAssignedOrders));
router.patch("/orders/:id/status", protect, isDriver, asyncHandler(driverUpdateStatus));
router.post("/orders/:id/accept", protect, isDriver, asyncHandler(driverAcceptAssignment));
router.post("/orders/:id/decline", protect, isDriver, asyncHandler(driverDeclineAssignment));

export default router;
