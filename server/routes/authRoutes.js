import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerUser } from "../controllers/Register.js";
import { loginUser } from "../controllers/Login.js";
    import { validateBody } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", validateBody(["username", "email", "password"]), asyncHandler(registerUser));
router.post("/login", validateBody(["email", "password"]), asyncHandler(loginUser));

export default router;
