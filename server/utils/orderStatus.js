export const ORDER_STATUSES = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export const VALID_TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled", "out_for_delivery"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: []
};

export const canTransition = (from, to) => {
  if (!from || !to) return false;
  return VALID_TRANSITIONS[from]?.includes(to) || false;
};

export const isTerminalStatus = (status) => status === "delivered" || status === "cancelled";
