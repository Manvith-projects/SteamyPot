import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";
import { listOffers, validateOffer, createOffer, updateOffer } from "../controllers/offerController.js";

const router = express.Router();

router.get("/", asyncHandler(listOffers));
router.post("/validate", asyncHandler(validateOffer));
router.post("/", protect, asyncHandler(createOffer));
router.patch("/:id", protect, asyncHandler(updateOffer));

export default router;
