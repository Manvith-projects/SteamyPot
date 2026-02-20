import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { listFood, listRestaurantsPublic, listRestaurantMenuPublic } from "../controllers/foodController.js";

const router = express.Router();

router.get("/restaurants", asyncHandler(listRestaurantsPublic));
router.get("/restaurants/:id/menu", asyncHandler(listRestaurantMenuPublic));
router.get("/food", asyncHandler(listFood));

export default router;
