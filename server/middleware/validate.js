export const validateBody = (fields) => (req, res, next) => {
  const missing = fields.filter((f) => {
    const value = req.body?.[f];
    return value === undefined || value === null || value === "";
  });
  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }
  next();
};
