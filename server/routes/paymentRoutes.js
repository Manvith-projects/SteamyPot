import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isUser } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { confirmPayment, failPayment, getPaymentStatus } from "../controllers/paymentController.js";
import { validateBody } from "../middleware/validate.js";

const router = express.Router();

router.get("/:orderId/status", protect, isUser, asyncHandler(getPaymentStatus));
router.post("/:orderId/confirm", protect, isUser, asyncHandler(confirmPayment));
router.post("/:orderId/fail", protect, isUser, validateBody(["reference"]), asyncHandler(failPayment));

export default router;
