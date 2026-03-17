const express = require("express");
const mongoose = require("mongoose");
const authJwt = require("../middleware/authJwt");
const Voucher = require("../models/Voucher");
const VoucherClaim = require("../models/VoucherClaim");

const router = express.Router();

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

async function markExpiredClaims(userId) {
  await VoucherClaim.updateMany(
    {
      user: userId,
      status: "claimed",
      expiresAt: { $lt: new Date() },
    },
    { status: "expired" }
  );
}

router.get("/available", async (_req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      dateExpirationShop: { $gte: now },
    })
      .populate("category", "id name")
      .sort({ createdAt: -1 });

    return res.status(200).json(vouchers);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load vouchers" });
  }
});

router.get("/claimed/me", authJwt, async (req, res) => {
  try {
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins do not claim vouchers" });
    }

    await markExpiredClaims(req.user.userId);

    const claims = await VoucherClaim.find({ user: req.user.userId })
      .populate({
        path: "voucher",
        populate: { path: "category", select: "id name" },
      })
      .sort({ claimedAt: -1 });

    return res.status(200).json(claims);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load claimed vouchers" });
  }
});

router.post("/:id/claim", authJwt, async (req, res) => {
  try {
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins cannot claim vouchers" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid voucher id" });
    }

    const voucher = await Voucher.findById(req.params.id);
    if (!voucher || !voucher.isActive) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const now = new Date();
    if (voucher.dateExpirationShop < now) {
      return res.status(400).json({ message: "Voucher is no longer available" });
    }

    await markExpiredClaims(req.user.userId);

    const existing = await VoucherClaim.findOne({
      voucher: voucher._id,
      user: req.user.userId,
      status: { $in: ["claimed", "used"] },
    });

    if (existing) {
      return res.status(409).json({ message: "You already claimed this voucher" });
    }

    const claimedAt = new Date();
    const expiresAt = new Date(claimedAt);
    expiresAt.setDate(expiresAt.getDate() + Number(voucher.dateExpirationAfterClaimDays));

    const claim = await VoucherClaim.create({
      voucher: voucher._id,
      user: req.user.userId,
      claimedAt,
      expiresAt,
      status: "claimed",
    });

    const populated = await claim.populate({
      path: "voucher",
      populate: { path: "category", select: "id name" },
    });

    return res.status(201).json(populated);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to claim voucher" });
  }
});

router.get("/admin", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const vouchers = await Voucher.find({})
      .populate("category", "id name")
      .sort({ createdAt: -1 });

    return res.status(200).json(vouchers);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load vouchers" });
  }
});

router.post("/", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      name,
      description,
      image,
      dateExpirationShop,
      dateExpirationAfterClaimDays,
      discountPercent,
      appliesTo,
      category,
    } = req.body;

    if (!name || !dateExpirationShop || !dateExpirationAfterClaimDays || !discountPercent) {
      return res.status(400).json({
        message: "name, dateExpirationShop, dateExpirationAfterClaimDays, discountPercent are required",
      });
    }

    const expiresAtShop = parseDate(dateExpirationShop);
    if (!expiresAtShop) {
      return res.status(400).json({ message: "Invalid dateExpirationShop" });
    }

    const claimDays = toNumber(dateExpirationAfterClaimDays);
    const discount = toNumber(discountPercent);
    if (!Number.isFinite(claimDays) || claimDays < 1) {
      return res.status(400).json({ message: "dateExpirationAfterClaimDays must be at least 1" });
    }
    if (!Number.isFinite(discount) || discount < 1 || discount > 100) {
      return res.status(400).json({ message: "discountPercent must be between 1 and 100" });
    }

    const scope = appliesTo === "category" ? "category" : "all";
    if (scope === "category" && (!category || !mongoose.Types.ObjectId.isValid(category))) {
      return res.status(400).json({ message: "Valid category is required when appliesTo is category" });
    }

    const voucher = await Voucher.create({
      name: String(name).trim(),
      description: description || "",
      image: image || "",
      dateExpirationShop: expiresAtShop,
      dateExpirationAfterClaimDays: claimDays,
      discountPercent: discount,
      appliesTo: scope,
      category: scope === "category" ? category : null,
      isActive: true,
    });

    const populated = await voucher.populate("category", "id name");
    return res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Voucher name already exists" });
    }
    return res.status(500).json({ message: "Failed to create voucher" });
  }
});

router.put("/:id", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid voucher id" });
    }

    const existing = await Voucher.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const updates = {};

    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.image !== undefined) updates.image = req.body.image;

    if (req.body.dateExpirationShop !== undefined) {
      const shopDate = parseDate(req.body.dateExpirationShop);
      if (!shopDate) return res.status(400).json({ message: "Invalid dateExpirationShop" });
      updates.dateExpirationShop = shopDate;
    }

    if (req.body.dateExpirationAfterClaimDays !== undefined) {
      const claimDays = toNumber(req.body.dateExpirationAfterClaimDays);
      if (!Number.isFinite(claimDays) || claimDays < 1) {
        return res.status(400).json({ message: "dateExpirationAfterClaimDays must be at least 1" });
      }
      updates.dateExpirationAfterClaimDays = claimDays;
    }

    if (req.body.discountPercent !== undefined) {
      const discount = toNumber(req.body.discountPercent);
      if (!Number.isFinite(discount) || discount < 1 || discount > 100) {
        return res.status(400).json({ message: "discountPercent must be between 1 and 100" });
      }
      updates.discountPercent = discount;
    }

    if (req.body.isActive !== undefined) {
      updates.isActive = req.body.isActive === true || req.body.isActive === "true";
    }

    if (req.body.appliesTo !== undefined) {
      const scope = req.body.appliesTo === "category" ? "category" : "all";
      updates.appliesTo = scope;

      if (scope === "category") {
        const categoryId = req.body.category || existing.category;
        if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
          return res.status(400).json({ message: "Valid category is required when appliesTo is category" });
        }
        updates.category = categoryId;
      } else {
        updates.category = null;
      }
    } else if (req.body.category !== undefined) {
      if (existing.appliesTo !== "category") {
        return res.status(400).json({ message: "Category can only be set when appliesTo is category" });
      }
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      updates.category = req.body.category;
    }

    const updated = await Voucher.findByIdAndUpdate(req.params.id, updates, { new: true }).populate(
      "category",
      "id name"
    );

    return res.status(200).json(updated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Voucher name already exists" });
    }
    return res.status(500).json({ message: "Failed to update voucher" });
  }
});

router.delete("/:id", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid voucher id" });
    }

    const updated = await Voucher.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    return res.status(200).json({ success: true });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to delete voucher" });
  }
});

module.exports = router;
