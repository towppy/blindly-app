const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require("../config");
const authJwt = require("../middleware/authJwt");
const User = require("../models/User");
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
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

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

    // Save user in MongoDB, including Firebase UID
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      phone: String(phone).trim(),
      image,
      isAdmin,
      firebaseUid: firebaseUser.uid,
    });

    // Send welcome email
    const mailOptions = {
      from: 'noreply@blindly.com',
      to: user.email,
      subject: 'Welcome to Blindly!',
      text: `Hi ${user.name},\n\nThank you for registering at Blindly!`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    return res.status(201).json({
      success: true,
      user: user.toJSON(),
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

router.put("/profile", authJwt, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "deliveryAddress1",
      "deliveryAddress2",
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
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
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
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ success: true });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

// PUT /users/change-password — authenticated user changes their own password
router.put("/change-password", authJwt, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.status(200).json({ success: true });
  } catch (_err) {
    return res.status(500).json({ message: "Failed to change password" });
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
      });
    } else if (!user.firebaseUid) {
      // Link to Firebase if not already linked
      try {
        firebaseUser = await firebaseAdmin.auth().getUserByEmail(normalizedEmail);
        user.firebaseUid = firebaseUser.uid;
        await user.save();
      } catch (e) {}
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
