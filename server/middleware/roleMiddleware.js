export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access only" });
  next();
};

export const isRestaurant = (req, res, next) => {
  if (req.user.role !== "restaurant")
    return res.status(403).json({ message: "Restaurant access only" });
  next();
};

export const isUser = (req, res, next) => {
  if (req.user.role !== "user")
    return res.status(403).json({ message: "User access only" });
  next();
};

export const isDriver = (req, res, next) => {
  if (req.user.role !== "driver")
    return res.status(403).json({ message: "Driver access only" });
  next();
};

export const isAdminOrRestaurant = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "restaurant") {
    return next();
  }
  return res.status(403).json({ message: "Admin or Restaurant access only" });
};
