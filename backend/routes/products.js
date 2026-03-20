const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // You'll need to create this
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const authJwt = require("../middleware/authJwt");
const Product = require("../models/Product");
const Promo = require("../models/Promo");
const StockAlert = require("../models/StockAlert");
const User = require("../models/User");
const { sendToTokens } = require("../services/notifications");
const config = require("../config");

const router = express.Router();
const MAX_PRODUCT_IMAGES = 10;

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }], // Optional: resize images
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
});

const STOCK_LOW_THRESHOLD = 10;

function applyPromoToProduct(productDoc, promoDoc) {
  const product = typeof productDoc.toJSON === "function" ? productDoc.toJSON() : { ...productDoc };
  const originalPrice = Number(product.price || 0);

  if (!promoDoc) {
    return {
      ...product,
      originalPrice,
      effectivePrice: originalPrice,
      hasActivePromo: false,
      promo: null,
    };
  }

  const discountPercent = Number(promoDoc.discountPercent || 0);
  const discounted = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));

  return {
    ...product,
    originalPrice,
    effectivePrice: discounted,
    hasActivePromo: true,
    promo: {
      id: String(promoDoc.id || promoDoc._id),
      name: promoDoc.name,
      description: promoDoc.description || "",
      discountPercent,
      startsAt: promoDoc.startsAt,
      endsAt: promoDoc.endsAt,
    },
  };
}

async function getBestActivePromosByProductId(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return new Map();

  const now = new Date();
  const promos = await Promo.find({
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    product: { $in: productIds },
  })
    .select("name description discountPercent startsAt endsAt product")
    .lean();

  const bestByProduct = new Map();
  for (const promo of promos) {
    const key = String(promo.product);
    const existing = bestByProduct.get(key);
    if (!existing || Number(promo.discountPercent || 0) > Number(existing.discountPercent || 0)) {
      bestByProduct.set(key, promo);
    }
  }

  return bestByProduct;
}

async function notifyAdmins(title, body) {
  try {
    const admins = await User.find({ isAdmin: true, pushToken: { $ne: "" } }, "pushToken pushTokenType").lean();
    const tokens = admins
      .filter((a) => a.pushToken)
      .map((a) => ({ token: a.pushToken, type: a.pushTokenType || "fcm" }));
    console.log(`[notifyAdmins] Sending to ${tokens.length} admin(s): "${title}"`);
    await sendToTokens(tokens, { title, body });
  } catch (error) {
    console.error('[notifyAdmins] Error:', error.message);
  }
}

async function updateStockAlerts(product) {
  const count = Number(product.countInStock || 0);
  const productId = product._id;
  const productName = product.name || "Product";

  if (count <= 0) {
    await StockAlert.updateMany(
      { product: productId, resolved: false, type: "low" },
      { resolved: true }
    );
    const existingOut = await StockAlert.findOne({ product: productId, resolved: false, type: "out" });
    if (!existingOut) {
      await StockAlert.create({
        product: productId,
        type: "out",
        threshold: STOCK_LOW_THRESHOLD,
        countInStock: count,
      });
      await notifyAdmins("Out of stock", `${productName} is out of stock.`);
    } else if (existingOut.countInStock !== count) {
      existingOut.countInStock = count;
      await existingOut.save();
    }
    return;
  }

  if (count <= STOCK_LOW_THRESHOLD) {
    await StockAlert.updateMany(
      { product: productId, resolved: false, type: "out" },
      { resolved: true }
    );
    const existingLow = await StockAlert.findOne({ product: productId, resolved: false, type: "low" });
    if (!existingLow) {
      await StockAlert.create({
        product: productId,
        type: "low",
        threshold: STOCK_LOW_THRESHOLD,
        countInStock: count,
      });
      await notifyAdmins("Low stock", `${productName} is low on stock (${count}).`);
    } else if (existingLow.countInStock !== count) {
      existingLow.countInStock = count;
      await existingLow.save();
    }
    return;
  }

  await StockAlert.updateMany(
    { product: productId, resolved: false },
    { resolved: true }
  );
}

// GET /products — public, used by home screen
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({ isActive: { $ne: false } }).populate("category", "id name color");
    const productIds = products.map((p) => p._id);
    const bestPromosByProductId = await getBestActivePromosByProductId(productIds);
    const enriched = products.map((p) => applyPromoToProduct(p, bestPromosByProductId.get(String(p._id))));
    return res.status(200).json(enriched);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load products" });
  }
});

// GET /products/:id — public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "id name color");
    if (!product) return res.status(404).json({ message: "Product not found" });
    const promoByProductId = await getBestActivePromosByProductId([product._id]);
    const enriched = applyPromoToProduct(product, promoByProductId.get(String(product._id)));
    return res.status(200).json(enriched);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load product" });
  }
});

// POST /products — admin only, multipart
router.post("/", authJwt, upload.array("images", MAX_PRODUCT_IMAGES), async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { name, brand, price, description, richDescription, category,
            countInStock, rating, numReviews, isFeatured } = req.body;
    if (!name || !brand || !price || !category || countInStock === undefined) {
      return res.status(400).json({ message: "name, brand, price, category and countInStock are required" });
    }
    
    let image = "";
    let images = [];
    if (req.files && req.files.length > 0) {
      // Cloudinary returns the secure URL in the path property
      images = req.files.map((f) => f.path); // Cloudinary secure URL
      image = images[0];
    }
    
    const product = await Product.create({
      name, brand, price: Number(price), description, richDescription,
      category, countInStock: Number(countInStock),
      rating: Number(rating || 0), numReviews: Number(numReviews || 0),
      isFeatured: isFeatured === "true" || isFeatured === true,
      image,
      images,
    });
    
    const populated = await product.populate("category", "id name color");
    await updateStockAlerts(product);
    return res.status(201).json(populated);
  } catch (error) {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: `Image is too large. Max file size is ${config.maxFileSizeMb}MB per image.` });
    }
    if (error?.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: `Too many images. Maximum is ${MAX_PRODUCT_IMAGES}.` });
    }
    console.error('[POST /products] Error:', error.message, error.stack);
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
});

// PUT /products/:id — admin only, multipart
router.put("/:id", authJwt, upload.array("images", MAX_PRODUCT_IMAGES), async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const { name, brand, price, description, richDescription, category,
            countInStock, rating, numReviews, isFeatured } = req.body;

  let image = existing.image;
let images = existing.images || [];

const existingImages = req.body.existingImages
  ? (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages])
  : [];

if (req.files && req.files.length > 0) {
  const newImages = req.files.map((f) => f.path);
  images = [...existingImages, ...newImages];
  image = images[0];
} else if (existingImages.length > 0) {
  images = existingImages;
  image = images[0];
}
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name || existing.name,
        brand: brand || existing.brand,
        price: price !== undefined ? Number(price) : existing.price,
        description: description !== undefined ? description : existing.description,
        richDescription: richDescription !== undefined ? richDescription : existing.richDescription,
        category: category || existing.category,
        countInStock: countInStock !== undefined ? Number(countInStock) : existing.countInStock,
        rating: rating !== undefined ? Number(rating) : existing.rating,
        numReviews: numReviews !== undefined ? Number(numReviews) : existing.numReviews,
        isFeatured: isFeatured !== undefined ? (isFeatured === "true" || isFeatured === true) : existing.isFeatured,
        image,
        images,
      },
      { new: true }
    ).populate("category", "id name color");

    await updateStockAlerts(updated);

    return res.status(200).json(updated);
  } catch (error) {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: `Image is too large. Max file size is ${config.maxFileSizeMb}MB per image.` });
    }
    if (error?.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: `Too many images. Maximum is ${MAX_PRODUCT_IMAGES}.` });
    }
    console.error('[PUT /products/:id] Full error:', JSON.stringify(error, null, 2));
    console.error('[PUT /products/:id] Message:', error.message);
    console.error('[PUT /products/:id] Stack:', error.stack);
    return res.status(500).json({ message: "Failed to update product", error: error.message });
}
});

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public_id.jpg
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
    if (matches && matches[1]) {
      return matches[1];
    }
    return null;
  } catch (error) {
    return null;
  }
}

// DELETE /products/:id — admin only, soft delete with optional image cleanup
router.delete("/:id", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // Optionally delete images from Cloudinary
    // Uncomment if you want to delete images when product is deleted
    /*
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          const publicId = extractPublicIdFromUrl(imageUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }
    }
    */
    
    const deleted = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;