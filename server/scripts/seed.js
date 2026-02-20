import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(MONGO_URI);
  const adminEmail = "admin@example.com";
  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log("Admin already exists", existing.email);
  } else {
    const password = "admin123";
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ username: "Admin", email: adminEmail, password: hashed, role: "admin" });
    console.log("Created admin user", admin.email, "password:", password);
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
