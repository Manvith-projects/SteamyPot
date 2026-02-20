export const applyStatusTimestamps = (order, status) => {
  if (!order || !status) return;
  const now = new Date();
  switch (status) {
    case "confirmed":
      if (!order.confirmedAt) order.confirmedAt = now;
      break;
    case "preparing":
      if (!order.preparingAt) order.preparingAt = now;
      break;
    case "out_for_delivery":
      if (!order.outForDeliveryAt) order.outForDeliveryAt = now;
      break;
    case "delivered":
      if (!order.deliveredAt) order.deliveredAt = now;
      break;
    case "cancelled":
      if (!order.cancelledAt) order.cancelledAt = now;
      break;
    default:
      break;
  }
};
