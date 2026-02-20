import Address from "../models/Address.js";

export const listAddresses = async (req, res) => {
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, updatedAt: -1 });
  res.json(addresses);
};

export const createAddress = async (req, res) => {
  const { label = "Home", line1, line2, city, state, zip, isDefault = false } = req.body;

  if (!line1 || !city) {
    return res.status(400).json({ message: "line1 and city are required" });
  }

  const hasDefault = await Address.exists({ userId: req.user.id, isDefault: true });

  if (isDefault) {
    await Address.updateMany({ userId: req.user.id }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    userId: req.user.id,
    label,
    line1,
    line2,
    city,
    state,
    zip,
    isDefault: isDefault || !hasDefault
  });

  res.status(201).json(address);
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { label, line1, line2, city, state, zip, isDefault } = req.body;

  const address = await Address.findOne({ _id: id, userId: req.user.id });
  if (!address) return res.status(404).json({ message: "Address not found" });

  if (isDefault) {
    await Address.updateMany({ userId: req.user.id }, { $set: { isDefault: false } });
  }

  ["label", "line1", "line2", "city", "state", "zip", "isDefault"].forEach((field) => {
    if (req.body[field] !== undefined) address[field] = req.body[field];
  });

  await address.save();
  res.json(address);
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const deleted = await Address.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Address not found" });

  if (deleted.isDefault) {
    const fallback = await Address.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { isDefault: true } },
      { sort: { updatedAt: -1 }, new: true }
    );
    return res.json({ message: "Address removed", reassignedDefault: fallback?._id || null });
  }

  res.json({ message: "Address removed" });
};
