const express = require("express");
const mongoose = require("mongoose");

const authJwt = require("../middleware/authJwt");
const Promo = require("../models/Promo");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendToTokens } = require("../services/notifications");

const router = express.Router();

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

async function notifyUsersPromoPublished(promo, productName) {
  const users = await User.find({}, "pushTokens pushToken pushTokenType").lean();
  const tokenSet = new Set();
  const tokens = [];

  for (const u of users) {
    for (const t of u.pushTokens || []) {
      if (t?.token && !tokenSet.has(t.token)) {
        tokenSet.add(t.token);
        tokens.push({ token: t.token, type: t.type });
      }
    }

    if (u.pushToken && !tokenSet.has(u.pushToken)) {
      tokenSet.add(u.pushToken);
      tokens.push({ token: u.pushToken, type: u.pushTokenType || "fcm" });
    }
  }

  if (tokens.length === 0) return { targeted: 0 };

  await sendToTokens(tokens, {
    title: `Promo: ${promo.name}`,
    body: `${Number(promo.discountPercent || 0)}% off on ${productName}. Limited time only!`,
    data: {
      type: "promo",
      title: promo.name,
      body: promo.description || "Limited-time product discount",
      details: `${Number(promo.discountPercent || 0)}% off until ${new Date(promo.endsAt).toLocaleDateString()}`,
      productId: String(promo.product?._id || promo.product || ""),
    },
  });

  return { targeted: tokens.length };
}

router.get("/active", async (_req, res) => {
  try {
    const now = new Date();
    const promos = await Promo.find({
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .populate("product", "id name price image")
      .sort({ createdAt: -1 });

    return res.status(200).json(promos);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load promos" });
  }
});

router.get("/admin", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const promos = await Promo.find({})
      .populate("product", "id name price image")
      .sort({ createdAt: -1 });

    return res.status(200).json(promos);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load promos" });
  }
});

router.post("/", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { name, description, discountPercent, product, startsAt, endsAt, isActive } = req.body;

    if (!name || !discountPercent || !product || !endsAt) {
      return res.status(400).json({ message: "name, discountPercent, product, endsAt are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc || productDoc.isActive === false) {
      return res.status(404).json({ message: "Product not found" });
    }

    const discount = toNumber(discountPercent);
    if (!Number.isFinite(discount) || discount < 1 || discount > 100) {
      return res.status(400).json({ message: "discountPercent must be between 1 and 100" });
    }

    const starts = startsAt ? parseDate(startsAt) : new Date();
    const ends = parseDate(endsAt);
    if (!starts || !ends) {
      return res.status(400).json({ message: "Invalid startsAt or endsAt date" });
    }
    if (ends <= starts) {
      return res.status(400).json({ message: "endsAt must be later than startsAt" });
    }

    const promo = await Promo.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      discountPercent: discount,
      product,
      startsAt: starts,
      endsAt: ends,
      isActive: isActive === undefined ? true : isActive === true || isActive === "true",
    });

    const populated = await promo.populate("product", "id name price image");
    if (populated.isActive) {
      const result = await notifyUsersPromoPublished(populated, populated.product?.name || "this product");
      populated.lastNotifiedAt = new Date();
      await populated.save();
      return res.status(201).json({ ...populated.toJSON(), notifiedUsers: result.targeted || 0 });
    }

    return res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Promo name already exists" });
    }
    return res.status(500).json({ message: "Failed to create promo" });
  }
});

router.put("/:id", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid promo id" });
    }

    const existing = await Promo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Promo not found" });
    }

    const updates = {};

    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.description !== undefined) updates.description = String(req.body.description || "").trim();
    if (req.body.discountPercent !== undefined) {
      const discount = toNumber(req.body.discountPercent);
      if (!Number.isFinite(discount) || discount < 1 || discount > 100) {
        return res.status(400).json({ message: "discountPercent must be between 1 and 100" });
      }
      updates.discountPercent = discount;
    }

    if (req.body.product !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(req.body.product)) {
        return res.status(400).json({ message: "Invalid product id" });
      }
      const productDoc = await Product.findById(req.body.product);
      if (!productDoc || productDoc.isActive === false) {
        return res.status(404).json({ message: "Product not found" });
      }
      updates.product = req.body.product;
    }

    if (req.body.startsAt !== undefined) {
      const starts = parseDate(req.body.startsAt);
      if (!starts) return res.status(400).json({ message: "Invalid startsAt" });
      updates.startsAt = starts;
    }

    if (req.body.endsAt !== undefined) {
      const ends = parseDate(req.body.endsAt);
      if (!ends) return res.status(400).json({ message: "Invalid endsAt" });
      updates.endsAt = ends;
    }

    if (req.body.isActive !== undefined) {
      updates.isActive = req.body.isActive === true || req.body.isActive === "true";
    }

    const mergedStarts = updates.startsAt || existing.startsAt;
    const mergedEnds = updates.endsAt || existing.endsAt;
    if (mergedEnds <= mergedStarts) {
      return res.status(400).json({ message: "endsAt must be later than startsAt" });
    }

    const updated = await Promo.findByIdAndUpdate(req.params.id, updates, { new: true }).populate(
      "product",
      "id name price image"
    );

    return res.status(200).json(updated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Promo name already exists" });
    }
    return res.status(500).json({ message: "Failed to update promo" });
  }
});

router.delete("/:id", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid promo id" });
    }

    const updated = await Promo.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Promo not found" });
    }

    return res.status(200).json({ success: true });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to delete promo" });
  }
});

module.exports = router;
