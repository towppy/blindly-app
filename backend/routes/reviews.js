const express = require("express");
const mongoose = require("mongoose");
const authJwt = require("../middleware/authJwt");
const Review = require("../models/Review");
const Order = require("../models/Order");

// bad words filter
const Filter = require("bad-words");
const filter = new Filter();

const router = express.Router();

// GET /reviews — admin only
router.get("/", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const reviews = await Review.find({ isActive: { $ne: false } })
      .populate("product", "name")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch {
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

// GET reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const reviews = await Review.find({
      product: productId,
      isActive: { $ne: false },
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch {
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

// Check if user can review
router.get("/can-review/:productId", authJwt, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    if (req.user?.isAdmin) {
      return res.status(200).json({ canReview: false, existingReview: null });
    }

    const order = await Order.findOne({
      user: req.user.userId,
      "orderItems.product": new mongoose.Types.ObjectId(productId),
      status: { $nin: ["cancelled"] },
    }).lean();

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.userId,
      isActive: { $ne: false },
    }).lean();

    res.status(200).json({
      canReview: !!order && !existingReview,
      existingReview: existingReview || null,
    });
  } catch {
    res.status(500).json({ message: "Failed to check review eligibility" });
  }
});

// POST review
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

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (comment && comment.trim().length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    const order = await Order.findOne({
      user: req.user.userId,
      "orderItems.product": new mongoose.Types.ObjectId(productId),
      status: { $nin: ["cancelled"] },
    }).lean();

    if (!order) {
      return res
        .status(403)
        .json({ message: "You can only review products from non-cancelled orders" });
    }

    const cleanComment = filter.clean(String(comment || "").trim());

    const softDeleted = await Review.findOne({
      product: productId,
      user: req.user.userId,
      isActive: false,
    });

    if (softDeleted) {
      softDeleted.isActive = true;
      softDeleted.rating = parsedRating;
      softDeleted.comment = cleanComment;

      await softDeleted.save();
      return res.status(201).json(softDeleted);
    }

    const review = await Review.create({
      product: productId,
      user: req.user.userId,
      rating: parsedRating,
      comment: cleanComment,
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product",
      });
    }

    res.status(500).json({ message: "Failed to submit review" });
  }
});

// UPDATE review
router.put("/:id", authJwt, async (req, res) => {
  try {
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins cannot edit reviews" });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You can only edit your own reviews" });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      const parsedRating = Number(rating);

      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      review.rating = parsedRating;
    }

    if (comment !== undefined) {
      if (comment.trim().length > 500) {
        return res.status(400).json({
          message: "Comment cannot exceed 500 characters",
        });
      }

      review.comment = filter.clean(String(comment).trim());
    }

    await review.save();

    res.status(200).json(review);
  } catch {
    res.status(500).json({ message: "Failed to update review" });
  }
});

// DELETE review
router.delete("/:id", authJwt, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const isOwner = review.user.toString() === req.user.userId;

    if (!req.user?.isAdmin && !isOwner) {
      return res.status(403).json({
        message: "Not authorized to delete this review",
      });
    }

    await Review.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;