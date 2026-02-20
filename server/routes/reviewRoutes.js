import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";
import { createReview, listRestaurantReviews, replyToReview } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/restaurant/:restaurantId", asyncHandler(listRestaurantReviews));
router.post("/", protect, asyncHandler(createReview));
router.patch("/:id/reply", protect, asyncHandler(replyToReview));

export default router;
