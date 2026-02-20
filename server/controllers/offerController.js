import Offer from "../models/Offer.js";

const STATUS_ERROR = (res, message, code = 400) => res.status(code).json({ message });

const assertOfferActive = (offer) => {
  const now = new Date();
  if (!offer.active) return false;
  if (offer.startsAt && offer.startsAt > now) return false;
  if (offer.endsAt && offer.endsAt < now) return false;
  return true;
};

const computeDiscount = (offer, subtotal) => {
  if (subtotal <= 0) return 0;
  if (offer.type === "flat") return Math.max(0, Math.min(offer.value, subtotal));
  const raw = (subtotal * offer.value) / 100;
  return Math.max(0, offer.maxDiscount ? Math.min(raw, offer.maxDiscount) : raw);
};

export const validateOfferCode = async ({ code, restaurantId, subtotal }) => {
  if (!code) throw new Error("Offer code is required");
  const normalized = code.trim().toUpperCase();
  const offer = await Offer.findOne({ code: normalized });
  if (!offer) throw new Error("Offer not found");
  if (!assertOfferActive(offer)) throw new Error("Offer not active");

  if (offer.restaurantId && restaurantId && offer.restaurantId.toString() !== restaurantId.toString()) {
    throw new Error("Offer not valid for this restaurant");
  }

  if (subtotal !== undefined && subtotal < offer.minOrder) {
    throw new Error(`Minimum order ${offer.minOrder} required`);
  }

  const discount = computeDiscount(offer, subtotal || 0);
  return { offer, discount };
};

export const validateOffer = async (req, res) => {
  try {
    const { code, restaurantId, subtotal = 0 } = req.body;
    const { offer, discount } = await validateOfferCode({ code, restaurantId, subtotal });
    res.json({ code: offer.code, type: offer.type, value: offer.value, discount, maxDiscount: offer.maxDiscount, minOrder: offer.minOrder });
  } catch (err) {
    STATUS_ERROR(res, err.message, 400);
  }
};

export const listOffers = async (req, res) => {
  const { restaurantId, includeExpired = "false" } = req.query;
  const filter = {};
  if (restaurantId) filter.restaurantId = restaurantId;
  if (includeExpired !== "true") {
    const now = new Date();
    filter.$and = [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      { active: true }
    ];
  }

  const offers = await Offer.find(filter).sort({ createdAt: -1 });
  res.json(offers);
};

const assertActorCanMutateOffer = (req, offerRestaurantId) => {
  if (req.user.role === "admin") return true;
  if (req.user.role === "restaurant" && (!offerRestaurantId || offerRestaurantId.toString() === req.user.id)) return true;
  return false;
};

export const createOffer = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "restaurant") {
    return STATUS_ERROR(res, "Not authorized", 403);
  }

  const payload = { ...req.body };
  if (req.user.role === "restaurant") {
    payload.restaurantId = req.user.id;
  }

  try {
    const offer = await Offer.create(payload);
    res.status(201).json(offer);
  } catch (err) {
    STATUS_ERROR(res, err.message, 400);
  }
};

export const updateOffer = async (req, res) => {
  const { id } = req.params;
  const offer = await Offer.findById(id);
  if (!offer) return STATUS_ERROR(res, "Offer not found", 404);

  if (!assertActorCanMutateOffer(req, offer.restaurantId)) {
    return STATUS_ERROR(res, "Not authorized", 403);
  }

  ["description", "type", "value", "minOrder", "maxDiscount", "startsAt", "endsAt", "active"].forEach((field) => {
    if (req.body[field] !== undefined) offer[field] = req.body[field];
  });

  if (req.user.role === "admin" && req.body.restaurantId !== undefined) {
    offer.restaurantId = req.body.restaurantId || null;
  }

  await offer.save();
  res.json(offer);
};
