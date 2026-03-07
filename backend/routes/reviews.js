const express = require("express");
const mongoose = require("mongoose");
const authJwt = require("../middleware/authJwt");
const Review = require("../models/Review");
const Order = require("../models/Order");

const router = express.Router();

// GET /reviews — admin only, all reviews for the admin panel
router.get("/", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const reviews = await Review.find({ isActive: { $ne: false } })
      .populate("product", "name")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load reviews" });
  }
});

// GET /reviews/product/:productId — public, all reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    const reviews = await Review.find({ product: productId, isActive: { $ne: false } })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load reviews" });
  }
});

// GET /reviews/can-review/:productId — auth required
// Returns { canReview: bool, existingReview: review|null }
// canReview = user has ordered product AND has no review yet
router.get("/can-review/:productId", authJwt, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    if (req.user?.isAdmin) {
      return res.status(200).json({ canReview: false, existingReview: null });
    }

    // Check if user has a non-cancelled order containing the product
    const order = await Order.findOne({
      user: req.user.userId,
      "orderItems.product": new mongoose.Types.ObjectId(productId),
      status: { $nin: ["cancelled"] },
    }).lean();
    const hasOrdered = !!order;

    // Check if user already has an active review
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.userId,
      isActive: { $ne: false },
    }).lean();

    return res.status(200).json({
      canReview: hasOrdered && !existingReview,
      existingReview: existingReview || null,
    });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to check review eligibility" });
  }
});

// POST /reviews — authenticated user submits a review (must have ordered product)
router.post("/", authJwt, async (req, res) => {
  try {
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins cannot post reviews" });
    }

    const { productId, rating, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Verify user has a non-cancelled order containing this product
    const order = await Order.findOne({
      user: req.user.userId,
      "orderItems.product": new mongoose.Types.ObjectId(productId),
      status: { $nin: ["cancelled"] },
    }).lean();
    if (!order) {
      return res.status(403).json({ message: "You can only review products from non-cancelled orders" });
    }

    // If a soft-deleted review exists, restore it with new data (preserves unique index)
    const softDeleted = await Review.findOne({
      product: productId,
      user: req.user.userId,
      isActive: false,
    });
    if (softDeleted) {
      softDeleted.isActive = true;
      softDeleted.rating = parsedRating;
      softDeleted.comment = String(comment || "").trim();
      await softDeleted.save();
      return res.status(201).json(softDeleted);
    }

    const review = await Review.create({
      product: productId,
      user: req.user.userId,
      rating: parsedRating,
      comment: String(comment || "").trim(),
    });

    return res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this product" });
    }
    return res.status(500).json({ message: "Failed to submit review" });
  }
});

// PUT /reviews/:id — owner only, edit their review
router.put("/:id", authJwt, async (req, res) => {
  try {
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins cannot edit reviews" });
    }
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You can only edit your own reviews" });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = parsedRating;
    }
    if (comment !== undefined) {
      review.comment = String(comment).trim();
    }
    await review.save();
    return res.status(200).json(review);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to update review" });
  }
});

// DELETE /reviews/:id — owner or admin, soft delete
router.delete("/:id", authJwt, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const isOwner = review.user.toString() === req.user.userId;
    if (!req.user?.isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await Review.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.status(200).json({ success: true });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;
