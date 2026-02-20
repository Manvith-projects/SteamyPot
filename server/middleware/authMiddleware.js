import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await User.findById(decoded.id).select("role isBlocked");
    if (!dbUser) return res.status(401).json({ message: "Not authorized" });
    if (dbUser.isBlocked) return res.status(403).json({ message: "Account is blocked" });

    req.user = { id: decoded.id, role: dbUser.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
};
