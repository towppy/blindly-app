const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const authJwt = require("../middleware/authJwt");
const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");
const { sendToTokens } = require("../services/notifications");

// bad words filter
const Filter = require("bad-words");
const filter = new Filter();

const router = express.Router();

const reviewStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "review_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const reviewUpload = multer({ storage: reviewStorage });

// GET /reviews — admin only
router.get("/", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const reviews = await Review.find({ isActive: { $ne: false } })
      .populate({
        path: "product",
        select: "name category",
        populate: { path: "category", select: "name" },
      })
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
      return res.status(200).json({ canReview: false, eligibleOrders: [], existingReviews: [] });
    }

    // Find all eligible orders for this product
    const orders = await Order.find({
      user: req.user.userId,
      "orderItems.product": new mongoose.Types.ObjectId(productId),
      status: { $nin: ["cancelled"] },
    }).lean();

    // Find all reviews for this product by this user
    const reviews = await Review.find({
      product: productId,
      user: req.user.userId,
      isActive: { $ne: false },
    }).lean();

    // For each order, check if a review exists
    const reviewMap = new Map();
    reviews.forEach(r => reviewMap.set(String(r.order), r));

    const eligibleOrders = orders.filter(o => !reviewMap.has(String(o._id)));

    res.status(200).json({
      canReview: eligibleOrders.length > 0,
      eligibleOrders,
      existingReviews: reviews,
    });
  } catch {
    res.status(500).json({ message: "Failed to check review eligibility" });
  }
});

// POST review
router.post("/", authJwt, reviewUpload.array("images", 5), async (req, res) => {
  try {
    if (req.user?.isAdmin) {
      return res.status(403).json({ message: "Admins cannot post reviews" });
    }

    const { productId, rating, comment, orderId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Valid orderId is required" });
    }

    const parsedRating = Number(rating);

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (comment && comment.trim().length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
      "orderItems.product": new mongoose.Types.ObjectId(productId),
      status: { $nin: ["cancelled"] },
    }).lean();

    if (!order) {
      return res
        .status(403)
        .json({ message: "You can only review products from your non-cancelled orders" });
    }

    const cleanComment = filter.clean(String(comment || "").trim());
    const uploadedImages = (req.files || []).map((f) => f.path);

    const softDeleted = await Review.findOne({
      product: productId,
      user: req.user.userId,
      order: orderId,
      isActive: false,
    });

    if (softDeleted) {
      softDeleted.isActive = true;
      softDeleted.rating = parsedRating;
      softDeleted.comment = cleanComment;
      softDeleted.images = uploadedImages;
      softDeleted.order = orderId;
      await softDeleted.save();
      return res.status(201).json(softDeleted);
    }

    const review = await Review.create({
      product: productId,
      user: req.user.userId,
      order: orderId,
      rating: parsedRating,
      comment: cleanComment,
      images: uploadedImages,
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('POST /api/v1/reviews error:', err);
    if (err.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product for this order",
      });
    }
    res.status(500).json({ message: "Failed to submit review", error: err.message || err });
  }
});

// UPDATE review
router.put("/:id", authJwt, reviewUpload.array("images", 5), async (req, res) => {
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

    if (req.files && req.files.length > 0) {
      const existingImages = req.body.existingImages
        ? (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages])
        : [];
      const newImages = req.files.map((f) => f.path);
      review.images = [...existingImages, ...newImages];
    } else if (req.body.existingImages !== undefined) {
      review.images = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : (req.body.existingImages ? [req.body.existingImages] : []);
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
    const reason = String(req.body?.reason || "").trim();

    if (!req.user?.isAdmin && !isOwner) {
      return res.status(403).json({
        message: "Not authorized to delete this review",
      });
    }

    if (req.user?.isAdmin && !reason) {
      return res.status(400).json({ message: "Deletion reason is required" });
    }

    await Review.findByIdAndUpdate(req.params.id, {
      isActive: false,
      deletionReason: req.user?.isAdmin ? reason : "",
      deletedAt: req.user?.isAdmin ? new Date() : null,
      deletedBy: req.user?.isAdmin ? req.user.userId : null,
    });

    if (req.user?.isAdmin) {
      const recipient = await User.findById(review.user, "pushTokens pushToken pushTokenType").lean();
      const tokens = [];
      if (recipient?.pushTokens?.length) {
        tokens.push(...recipient.pushTokens.map((t) => ({ token: t.token, type: t.type })));
      }
      if (recipient?.pushToken) {
        tokens.push({ token: recipient.pushToken, type: recipient.pushTokenType || "fcm" });
      }

      if (tokens.length > 0) {
        await sendToTokens(tokens, {
          title: "Review removed by admin",
          body: `Your review was removed. Reason: ${reason}`,
          data: {
            type: "review",
            reason,
          },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;