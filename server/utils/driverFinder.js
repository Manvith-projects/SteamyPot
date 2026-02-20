import Driver from "../models/Driver.js";

// Find the first available online driver who is not blocked and not busy.
// excludeDriverIds: array of userIds to skip (e.g., the decliner).
export const findAvailableDriver = async ({ excludeDriverIds = [] } = {}) => {
  const exclude = (excludeDriverIds || []).map((id) => id?.toString());

  const candidates = await Driver.find({
    isOnline: true,
    $or: [{ currentOrderId: null }, { currentOrderId: { $exists: false } }]
  }).populate("userId", "username email isBlocked isOnline");

  const driver = candidates.find(
    (d) => d.userId && !d.userId.isBlocked && d.userId.isOnline && !exclude.includes(d.userId._id.toString())
  );

  return driver ? driver.userId : null;
};
