import FoodItem from "../models/FoodItem.js";
import User from "../models/User.js";
import { buildPagination } from "../utils/pagination.js";

export const listFood = async (req, res) => {
  const { restaurantId, q } = req.query;
  const filter = {};
  if (restaurantId) filter.restaurantId = restaurantId;
  if (q) filter.name = { $regex: q, $options: "i" };
  const { limit, skip } = buildPagination(req.query);
  const items = await FoodItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.json({ data: items, page: req.query.page || 1, limit });
};

export const listRestaurantsPublic = async (req, res) => {
  const { q, cuisines, tags, isOpen, sort } = req.query;

  const filter = { role: "restaurant", approval: true };
  if (q) filter.username = { $regex: q, $options: "i" };
  if (isOpen === "true") filter.isOpen = true;
  if (cuisines) filter.cuisines = { $in: cuisines.split(",").map((c) => c.trim()) };
  if (tags) filter.tags = { $in: tags.split(",").map((t) => t.trim()) };

  const sortBy = (() => {
    if (sort === "rating") return { ratingAvg: -1, ratingCount: -1 };
    if (sort === "eta") return { etaMins: 1 };
    if (sort === "fee") return { deliveryFee: 1 };
    return { createdAt: -1 };
  })();

  const restaurants = await User.find(filter)
    .select("username email approval cuisines tags deliveryFee etaMins ratingAvg ratingCount isOpen createdAt")
    .sort(sortBy);

  res.json(restaurants);
};

export const listRestaurantMenuPublic = async (req, res) => {
  const { id } = req.params;
  const { q } = req.query;
  const restaurant = await User.findOne({ _id: id, role: "restaurant", approval: true });
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found or not approved" });

  const { limit, skip } = buildPagination(req.query);
  const filter = { restaurantId: id };
  if (q) filter.name = { $regex: q, $options: "i" };
  const items = await FoodItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.json({
    restaurant: {
      id: restaurant._id,
      name: restaurant.username,
      cuisines: restaurant.cuisines,
      tags: restaurant.tags,
      deliveryFee: restaurant.deliveryFee,
      etaMins: restaurant.etaMins,
      ratingAvg: restaurant.ratingAvg,
      ratingCount: restaurant.ratingCount,
      isOpen: restaurant.isOpen
    },
    data: items,
    page: req.query.page || 1,
    limit
  });
};
