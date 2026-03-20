const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const config = require("../config");
const authJwt = require("../middleware/authJwt");
const User = require("../models/User");
const Product = require("../models/Product");
const upload = require("../helpers/upload");


const firebaseAdmin = require("../config/firebase");
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '<YOUR_GOOGLE_CLIENT_ID>';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Nodemailer setup (Mailtrap)
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 2525),
  secure: Number(process.env.MAIL_PORT || 2525) === 465,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@blindly.com';

function emailShell({ title, subtitle, bodyHtml, accent = "#7c3aed" }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:20px;background:#f5f3ff;font-family:Arial,sans-serif;color:#1f1235;">
        <table cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ece8ff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px;background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:#fff;">
              <div style="font-size:22px;font-weight:800;letter-spacing:.2px;">Blindly</div>
              <div style="font-size:13px;opacity:.9;margin-top:4px;">see the beauty within</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <div style="font-size:24px;font-weight:800;color:${accent};margin-bottom:6px;">${title}</div>
              <div style="font-size:14px;color:#6b5d95;margin-bottom:16px;">${subtitle}</div>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f0fdf4;border-top:1px solid #d1fae5;color:#0f766e;font-size:12px;">
              This is an automated Blindly email.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function hashVerificationToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken)).digest("hex");
}

function buildVerificationUrl(rawToken) {
  return `${config.publicApiBaseUrl}/users/verify-email?token=${encodeURIComponent(rawToken)}`;
}

async function sendVerificationEmail(user, rawToken) {
  const verificationUrl = buildVerificationUrl(rawToken);
  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#2a1b4f;">Hi ${user.name || "there"}, verify your email to activate your Blindly account.</p>
    <p style="margin:0 0 16px;">
      <a href="${verificationUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:700;">Verify Email</a>
    </p>
    <p style="margin:0 0 10px;font-size:13px;color:#6b5d95;">If the button does not work, copy this link:</p>
    <p style="margin:0;padding:10px;border-radius:8px;background:#f5f3ff;color:#5b21b6;font-size:12px;word-break:break-all;">${verificationUrl}</p>
    <p style="margin:14px 0 0;font-size:12px;color:#7e72a8;">This link expires in 24 hours.</p>
  `;
  const mailOptions = {
    from: MAIL_FROM,
    to: user.email,
    subject: "Verify your Blindly account",
    text: `Hi ${user.name},\n\nPlease verify your email by opening this link:\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
    html: emailShell({
      title: "Verify your email",
      subtitle: "One step left before you can log in.",
      bodyHtml,
      accent: "#7c3aed",
    }),
  };

  await transporter.sendMail(mailOptions);
}

async function sendAccountStatusEmail({ user, action, reason }) {
  const safeReason = reason || "No reason provided";
  const isDelete = action === "delete";
  const subject = isDelete
    ? "Your Blindly account has been deleted"
    : "Your Blindly account has been deactivated";

  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#2a1b4f;">Hi ${user.name || "there"},</p>
    <p style="margin:0 0 12px;font-size:15px;color:#2a1b4f;">
      Your account has been ${isDelete ? "deleted" : "deactivated"} by an administrator.
    </p>
    <div style="border:1px solid #e9d5ff;background:#faf5ff;border-radius:12px;padding:12px;">
      <div style="font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">Reason</div>
      <div style="margin-top:6px;font-size:14px;color:#3b2c63;">${safeReason}</div>
    </div>
    <p style="margin:14px 0 0;font-size:13px;color:#6b5d95;">If you think this is a mistake, contact support.</p>
  `;

  await transporter.sendMail({
    from: MAIL_FROM,
    to: user.email,
    subject,
    text: `Hi ${user.name || "there"},\n\nYour Blindly account has been ${isDelete ? "deleted" : "deactivated"}.\nReason: ${safeReason}\n\nIf you think this is a mistake, contact support.`,
    html: emailShell({
      title: isDelete ? "Account deleted" : "Account deactivated",
      subtitle: "We are sharing this update for your records.",
      bodyHtml,
      accent: isDelete ? "#ef4444" : "#f97316",
    }),
  });
}

async function verifyEmailToken(rawToken) {
  const tokenHash = hashVerificationToken(rawToken);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  user.emailVerifiedAt = new Date();
  await user.save();

  if (user.firebaseUid) {
    try {
      await firebaseAdmin.auth().updateUser(user.firebaseUid, { emailVerified: true });
    } catch (_err) {
      // Ignore Firebase sync failures so local verification still succeeds.
    }
  }

  return { ok: true, user };
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

router.post("/register", upload.single("image"), async (req, res) => {
  try {
    // Log Firebase project ID to confirm correct project
    try {
      const projectId = firebaseAdmin.app().options.credential.projectId || firebaseAdmin.app().options.projectId;
      console.log(`[Firebase] Using project: ${projectId}`);
    } catch (projErr) {
      console.log('[Firebase] Could not determine project ID:', projErr.message);
    }
    const { name, email, password, phone } = req.body;
    const isAdmin = toBoolean(req.body.isAdmin);

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "name, email, password, and phone are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }


    // Create user in Firebase Authentication
    let firebaseUser;
    let firebasePayload = {
      email: normalizedEmail,
      password: String(password),
      displayName: String(name).trim(),
    };
    // Try to add phoneNumber if it looks like E.164 format
    const phoneTrimmed = String(phone).trim();
    if (/^\+\d{10,15}$/.test(phoneTrimmed)) {
      firebasePayload.phoneNumber = phoneTrimmed;
    }
    try {
      firebaseUser = await firebaseAdmin.auth().createUser(firebasePayload);
    } catch (fbErr) {
      console.error("[Firebase Register Error]", fbErr.message, fbErr);
      return res.status(500).json({ message: "Failed to create user in Firebase", error: fbErr.message });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const image = req.file ? req.file.path : "";

    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashVerificationToken(rawVerificationToken);

    // Save user in MongoDB, including Firebase UID
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      phone: String(phone).trim(),
      image,
      isAdmin,
      firebaseUid: firebaseUser.uid,
      isEmailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    });

    try {
      await sendVerificationEmail(user, rawVerificationToken);
    } catch (mailError) {
      console.error('[Register] Verification email send error:', mailError.message);
      return res.status(500).json({ message: "User created but failed to send verification email. Please try again." });
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email before logging in.",
      requiresEmailVerification: true,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    // Try to get user from MongoDB
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Try to verify credentials with Firebase Authentication
    let firebaseUser;
    try {
      // Firebase Admin does not support password verification directly.
      // In production, you should verify the password on the client using Firebase SDK,
      // then send the ID token to the backend for verification.
      // For demonstration, fallback to local password check for now.
      // Optionally, you can use a custom endpoint to verify with Firebase REST API.
      firebaseUser = await firebaseAdmin.auth().getUserByEmail(normalizedEmail);
    } catch (fbErr) {
      // If user not found in Firebase, treat as invalid
      return res.status(401).json({ message: "Invalid credentials (Firebase)" });
    }

    // Local password check (since Firebase Admin cannot check password)
    const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    return res.status(200).json({ token, user: payload });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to login" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const result = await verifyEmailToken(token);
    if (!result.ok) {
      return res.status(400).json({ message: "Verification link is invalid or expired" });
    }

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to verify email" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const token = String(req.query?.token || "").trim();
    if (!token) {
      return res.status(400).send(emailShell({
        title: "Missing token",
        subtitle: "Open the full verification link from your email.",
        bodyHtml: "<p style=\"margin:0;font-size:14px;color:#6b5d95;\">Please request a new verification email from the app if needed.</p>",
        accent: "#ef4444",
      }));
    }

    const result = await verifyEmailToken(token);
    if (!result.ok) {
      return res.status(400).send(emailShell({
        title: "Link expired or invalid",
        subtitle: "Your verification link can only be used once and expires after 24 hours.",
        bodyHtml: "<p style=\"margin:0;font-size:14px;color:#6b5d95;\">Please return to the app and tap Resend verification email.</p>",
        accent: "#ef4444",
      }));
    }

    return res.status(200).send(emailShell({
      title: "Email verified",
      subtitle: "Your Blindly account is ready.",
      bodyHtml: "<p style=\"margin:0;font-size:14px;color:#2a1b4f;\">You can now return to the app and log in.</p>",
      accent: "#16a34a",
    }));
  } catch (_err) {
    return res.status(500).send(emailShell({
      title: "Verification failed",
      subtitle: "Please try again shortly.",
      bodyHtml: "<p style=\"margin:0;font-size:14px;color:#6b5d95;\">If this keeps happening, request a new verification email in the app.</p>",
      accent: "#ef4444",
    }));
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: "If that account exists, a verification email has been sent." });
    }

    if (user.isEmailVerified === true) {
      return res.status(200).json({ success: true, message: "Email is already verified." });
    }

    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = hashVerificationToken(rawVerificationToken);
    user.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);
    await user.save();

    await sendVerificationEmail(user, rawVerificationToken);
    return res.status(200).json({ success: true, message: "Verification email sent." });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to resend verification email" });
  }
});

router.put("/profile", authJwt, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "deliveryAddress1",
      "deliveryAddress2",
      "deliveryRegion",
      "deliveryCity",
      "deliveryZip",
      "deliveryCountry",
      "deliveryLocation",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
    }
    if (typeof updates.phone === "string") {
      updates.phone = updates.phone.trim();
    }
    if (typeof updates.deliveryAddress1 === "string") {
      updates.deliveryAddress1 = updates.deliveryAddress1.trim();
    }
    if (typeof updates.deliveryAddress2 === "string") {
      updates.deliveryAddress2 = updates.deliveryAddress2.trim();
    }
    if (typeof updates.deliveryCity === "string") {
      updates.deliveryCity = updates.deliveryCity.trim();
    }
    if (typeof updates.deliveryRegion === "string") {
      updates.deliveryRegion = updates.deliveryRegion.trim();
    }
    if (typeof updates.deliveryZip === "string") {
      updates.deliveryZip = updates.deliveryZip.trim();
    }
    if (typeof updates.deliveryCountry === "string") {
      updates.deliveryCountry = updates.deliveryCountry.trim();
    }

    if (updates.deliveryLocation) {
      const { latitude, longitude } = updates.deliveryLocation;
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ message: "deliveryLocation must include numeric latitude and longitude" });
      }

      updates.deliveryLocation = { latitude: lat, longitude: lng };
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.toJSON());
  } catch (_error) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

// GET /users/me/favorites — authenticated user favorite products
router.get("/me/favorites", authJwt, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("favoriteProducts", "name image price isActive")
      .select("favoriteProducts");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favorites = (user.favoriteProducts || []).filter((p) => p && p.isActive !== false);
    const favoriteIds = favorites.map((p) => String(p._id));

    return res.status(200).json({
      favoriteIds,
      favorites,
    });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load favorites" });
  }
});

// POST /users/me/favorites/:productId — add product to favorites
router.post("/me/favorites/:productId", authJwt, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(String(productId))) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const product = await Product.findById(productId).select("_id isActive");
    if (!product || product.isActive === false) {
      return res.status(404).json({ message: "Product not found" });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { favoriteProducts: product._id },
    });

    return res.status(200).json({ success: true, productId: String(product._id), isFavorite: true });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to add favorite" });
  }
});

// DELETE /users/me/favorites/:productId — remove product from favorites
router.delete("/me/favorites/:productId", authJwt, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(String(productId))) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { favoriteProducts: productId },
    });

    return res.status(200).json({ success: true, productId: String(productId), isFavorite: false });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to remove favorite" });
  }
});

router.put("/profile-photo", authJwt, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const image = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { image },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.toJSON());

  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile photo" });
  }
});

// POST /users/push-token — add device push token to the current user's pushTokens array
router.post("/push-token", authJwt, async (req, res) => {
  try {
    const { token, type } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Push token is required" });
    }

    const tokenType = type || (String(token).startsWith("ExponentPushToken") ? "expo" : "fcm");
    console.log(`[POST /push-token] Saving ${tokenType} push token for user ${req.user.userId}: ${String(token).substring(0, 30)}...`);

    // Remove any existing entry with the same token value, then add the new one
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { pushTokens: { token: String(token) } },
    });
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { pushTokens: { token: String(token), type: tokenType } },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[POST /push-token] Error:', error.message);
    return res.status(500).json({ message: "Failed to save push token" });
  }
});

// DELETE /users/push-token — remove a specific push token on logout
router.delete("/push-token", authJwt, async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { pushTokens: { token: String(token) } },
      });
    } else {
      // No specific token provided — clear all tokens for this user
      await User.findByIdAndUpdate(req.user.userId, { $set: { pushTokens: [] } });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[DELETE /push-token] Error:', error.message);
    return res.status(500).json({ message: "Failed to remove push token" });
  }
});

// GET /users — admin only, list all users
router.get("/", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const users = await User.find().sort({ createdAt: -1 }).lean();
    // Use toJSON transform by calling it on each document is not available on lean()
    // Strip sensitive fields manually
    const safe = users.map((u) => {
      const { passwordHash, pushTokens, _id, __v, ...rest } = u;
      return { ...rest, id: String(_id) };
    });
    return res.status(200).json(safe);
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load users" });
  }
});

// PATCH /users/:id/deactivate — admin only
router.patch("/:id/deactivate", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    const reason = req.body?.reason || '';
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    try {
      await sendAccountStatusEmail({ user, action: "deactivate", reason });
    } catch (mailErr) {
      console.error("[Deactivate] Email send error:", mailErr.message);
    }
    return res.status(200).json({ success: true, isActive: false });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to deactivate user" });
  }
});

// PATCH /users/:id/activate — admin only
router.patch("/:id/activate", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ success: true, isActive: true });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to activate user" });
  }
});

// DELETE /users/:id — admin only, soft delete (sets isActive: false)
router.delete("/:id", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ message: "Admin access required" });
    const reason = req.body?.reason || '';
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    try {
      await sendAccountStatusEmail({ user, action: "delete", reason });
    } catch (mailErr) {
      console.error("[Delete] Email send error:", mailErr.message);
    }
    return res.status(200).json({ success: true });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

// PUT /users/change-password — authenticated user changes their own password
router.put("/change-password", authJwt, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "newPassword is required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasPassword = Boolean(user.passwordHash);
    if (hasPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "currentPassword is required" });
      }
      const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
      if (!matches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.status(200).json({ success: true, mode: hasPassword ? "changed" : "added" });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to change password" });
  }
});

// PATCH /users/me/deactivate — authenticated user self-deactivate
router.patch("/me/deactivate", authJwt, async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        isActive: false,
        accountStatus: "deactivated",
        accountStatusReason: reason,
        accountStatusUpdatedAt: new Date(),
        pushTokens: [],
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, status: "deactivated" });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to deactivate account" });
  }
});

// DELETE /users/me — authenticated user account deletion request
router.delete("/me", authJwt, async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Best-effort Firebase account cleanup if linked
    if (user.firebaseUid) {
      try {
        await firebaseAdmin.auth().deleteUser(user.firebaseUid);
      } catch (_e) {
        // Ignore Firebase errors here so account action can proceed
      }
    }

    const suffix = `${Date.now()}-${String(user._id).slice(-6)}`;
    user.name = `Deleted User ${suffix}`;
    user.email = `deleted-${suffix}@blindly.local`;
    user.phone = "";
    user.image = "";
    user.passwordHash = await bcrypt.hash(`${suffix}-deleted`, 10);
    user.deliveryAddress1 = "";
    user.deliveryAddress2 = "";
    user.deliveryRegion = "";
    user.deliveryCity = "";
    user.deliveryZip = "";
    user.deliveryCountry = "";
    user.favoriteProducts = [];
    user.deliveryLocation = { latitude: null, longitude: null };
    user.pushTokens = [];
    user.isActive = false;
    user.accountStatus = "deleted";
    user.accountStatusReason = reason;
    user.accountStatusUpdatedAt = new Date();
    user.firebaseUid = null;
    await user.save();

    return res.status(200).json({ success: true, status: "deleted" });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

// GET /users/admin/push-readiness — admin only, token count diagnostics per user
router.get("/admin/push-readiness", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const users = await User.find()
      .select("name email isAdmin isActive pushTokens createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    let pushReadyCount = 0;
    let totalTokens = 0;

    const diagnostics = users.map((u) => {
      const entries = Array.isArray(u.pushTokens) ? u.pushTokens : [];
      const uniqueTokens = new Set(entries.map((t) => String(t?.token || "")).filter(Boolean));
      const tokenCount = uniqueTokens.size;
      const expoCount = entries.filter((t) => t?.type === "expo").length;
      const fcmCount = entries.filter((t) => t?.type === "fcm").length;
      const unknownCount = entries.filter((t) => !t?.type || t?.type === "unknown").length;

      if (tokenCount > 0) {
        pushReadyCount += 1;
      }
      totalTokens += tokenCount;

      return {
        id: String(u._id),
        name: u.name || "",
        email: u.email || "",
        isAdmin: u.isAdmin === true,
        isActive: u.isActive !== false,
        pushReady: tokenCount > 0,
        tokenCount,
        byType: {
          expo: expoCount,
          fcm: fcmCount,
          unknown: unknownCount,
        },
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return res.status(200).json({
      summary: {
        totalUsers: diagnostics.length,
        pushReadyUsers: pushReadyCount,
        usersWithoutTokens: diagnostics.length - pushReadyCount,
        totalTokens,
      },
      users: diagnostics,
    });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to load push readiness diagnostics" });
  }
});

// GET /users/:id — must be LAST to avoid catching static routes like /profile-photo
router.get("/:id", authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.userId;
    const requesterIsAdmin = req.user?.isAdmin === true;

    if (!requesterIsAdmin && requesterId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.toJSON());
  } catch (_error) {
    return res.status(500).json({ message: "Failed to load user profile" });
  }
});

// Google Sign-In endpoint
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;
    if (!email) {
      return res.status(400).json({ message: 'Google account must have an email' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists in MongoDB
    let user = await User.findOne({ email: normalizedEmail });
    let firebaseUser;
    if (!user) {
      // Create user in Firebase Auth if not exists
      try {
        firebaseUser = await firebaseAdmin.auth().getUserByEmail(normalizedEmail);
      } catch (e) {
        firebaseUser = await firebaseAdmin.auth().createUser({
          email: normalizedEmail,
          displayName: name,
          photoURL: picture,
        });
      }
      // Save user in MongoDB
      user = await User.create({
        name: name || normalizedEmail,
        email: normalizedEmail,
        passwordHash: '', // No password for Google users
        phone: '',
        image: picture || '',
        isAdmin: false,
        firebaseUid: firebaseUser ? firebaseUser.uid : undefined,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });
    } else if (!user.firebaseUid) {
      // Link to Firebase if not already linked
      try {
        firebaseUser = await firebaseAdmin.auth().getUserByEmail(normalizedEmail);
        user.firebaseUid = firebaseUser.uid;
        user.isEmailVerified = true;
        user.emailVerifiedAt = user.emailVerifiedAt || new Date();
        user.emailVerificationTokenHash = null;
        user.emailVerificationExpiresAt = null;
        await user.save();
      } catch (e) {}
    } else if (user.isEmailVerified !== true) {
      user.isEmailVerified = true;
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
      user.emailVerificationTokenHash = null;
      user.emailVerificationExpiresAt = null;
      await user.save();
    }

    // Issue JWT
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    const token = jwt.sign(jwtPayload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return res.status(200).json({ token, user: jwtPayload });
  } catch (err) {
    console.error('[POST /google-login] Error:', err.message);
    return res.status(500).json({ message: 'Google login failed' });
  }
});

module.exports = router;
