import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getProfile, getMyOrders } from "../controllers/userController.js";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "../controllers/addressController.js";

const router = express.Router();

router.get("/profile", protect, asyncHandler(getProfile));
router.get("/orders", protect, asyncHandler(getMyOrders));
router.get("/addresses", protect, asyncHandler(listAddresses));
router.post("/addresses", protect, asyncHandler(createAddress));
router.patch("/addresses/:id", protect, asyncHandler(updateAddress));
router.delete("/addresses/:id", protect, asyncHandler(deleteAddress));

export default router;
