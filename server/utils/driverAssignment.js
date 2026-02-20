import Driver from "../models/Driver.js";

// Clears the driver assignment for a closed or cancelled order.
export const releaseDriver = async (order) => {
  if (!order?.driverId) return;
  await Driver.findOneAndUpdate(
    { userId: order.driverId },
    { $set: { currentOrderId: null, isOnline: true } },
    { upsert: true }
  );
};
