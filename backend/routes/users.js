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
    const reason = req.body?.reason || '';
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send styled deactivation email
  console.log('[Deactivate] Sending deactivation email to:', user.email, '| Reason:', reason);

const mailOptions = {
  from: '"Blindly" <noreply@blindly.com>',
  to: user.email,
  subject: 'Your Blindly account has been deactivated',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
        <tr>
          <td style="padding: 30px; background: #7c3aed; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Blindly</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Hi ${user.name || 'there'},</p>
            
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
              Your Blindly account has been deactivated.
            </p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f3f3; border-radius: 5px; margin: 20px 0;">
              <tr>
                <td style="padding: 15px;">
                  <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">Reason for deactivation:</p>
                  <p style="margin: 0; font-size: 16px; color: #333; font-weight: bold;">${reason || 'No reason provided'}</p>
                </td>
              </tr>
            </table>
            
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
              If you have questions, please contact support.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; font-size: 12px; color: #999;">© 2024 Blindly. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  text: `
    Hi ${user.name || 'there'},
    
    Your Blindly account has been deactivated.
    
    Reason: ${reason || 'No reason provided'}
    
    If you have questions, please contact support.
    
    - Blindly Team
  `
};


// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('💔 Email send error:', error);
    console.error('[Deactivate] Failed to send email to:', user.email);
    
    // Log to your error tracking
    console.error({
      event: 'DEACTIVATION_EMAIL_FAILED',
      userId: user._id,
      email: user.email,
      reason: reason,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('💜 Deactivation email sent successfully!', {
      response: info.response,
      messageId: info.messageId,
      to: user.email,
      timestamp: new Date().toISOString()
    });
  }
});
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[Deactivate] Email send error:', error);
      } else {
        console.log('[Deactivate] Deactivation email sent:', info.response);
      }
    });
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
    // Send styled deactivation email
    console.log('[Delete] Preparing to send deactivation email...');
    console.log('[Delete] User:', user.email, '| Name:', user.name, '| Reason:', reason);
    const mailOptions = {
      from: '"🌸 Blindly Care Team" <hello@blindly.com>',
      to: user.email,
      subject: '💜 Your Blindly Account Has Been Deactivated',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Account Deactivation</title><style>body{font-family:'Segoe UI','Helvetica Neue','Apple Color Emoji','Segoe UI Emoji',sans-serif;line-height:1.6;margin:0;padding:0;background-color:#faf5ff;}.container{max-width:560px;margin:30px auto;background-color:#ffffff;border-radius:32px;overflow:hidden;box-shadow:0 10px 30px rgba(124,58,237,0.15);border:2px solid #f3e8ff;}.header{background:linear-gradient(145deg,#f3e8ff,#ffffff);padding:40px 30px 30px;text-align:center;border-bottom:3px dashed #d8b4fe;}.header-icon{font-size:48px;margin-bottom:15px;background-color:#f3e8ff;width:80px;height:80px;line-height:80px;border-radius:40px;display:inline-block;box-shadow:0 4px 10px rgba(124,58,237,0.2);}.header h1{color:#5b21b6;font-size:28px;font-weight:700;margin:10px 0 5px;letter-spacing:-0.5px;}.header-subtitle{color:#7c3aed;font-size:16px;font-weight:400;opacity:0.9;}.content{padding:30px;background-color:#ffffff;}.greeting{font-size:18px;color:#2d1b4e;font-weight:600;margin-bottom:15px;}.greeting span{background-color:#f3e8ff;padding:5px 12px;border-radius:50px;font-size:24px;margin-right:8px;}.reason-box{background-color:#faf5ff;border-radius:24px;padding:20px;margin:25px 0;border:2px solid #e9d5ff;position:relative;}.reason-box:before{content:"📋";position:absolute;top:-12px;left:20px;background:white;padding:0 10px;font-size:20px;}.reason-label{font-size:14px;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:8px;}.reason-text{font-size:18px;color:#2d1b4e;font-weight:500;padding-left:10px;border-left:4px solid #d8b4fe;}.info-card{background-color:#ffffff;border-radius:20px;padding:20px;margin:20px 0;border:2px solid #f3e8ff;}.info-title{color:#5b21b6;font-size:16px;font-weight:700;margin-bottom:15px;display:flex;align-items:center;gap:8px;}.info-title span{font-size:20px;}.info-text{color:#4a3a6b;font-size:15px;margin-bottom:12px;padding-left:15px;border-left:2px solid #e9d5ff;}.button-container{text-align:center;margin:35px 0 20px;}.button{background:linear-gradient(145deg,#7c3aed,#5b21b6);color:#ffffff;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 6px 15px rgba(124,58,237,0.4);border:2px solid #f3e8ff;}.button:hover{background:linear-gradient(145deg,#8b5cf6,#6d28d9);}.note{background-color:#fff9f0;border-radius:20px;padding:20px;margin:25px 0;border:2px dashed #fcd34d;}.note-title{color:#b45309;font-weight:600;margin-bottom:10px;font-size:16px;}.note-text{color:#92400e;font-size:14px;}.footer{background-color:#faf5ff;padding:25px 30px;text-align:center;border-top:3px solid #e9d5ff;}.footer-text{color:#7c3aed;font-size:14px;margin:5px 0;}.footer-icon{font-size:24px;margin:10px 0;}.social-links{margin-top:15px;}.social-links a{display:inline-block;margin:0 8px;color:#7c3aed;text-decoration:none;font-size:20px;}hr{border:none;border-top:2px dotted #e9d5ff;margin:20px 0;}</style></head><body><div class="container"><div class="header"><div class="header-icon">💜</div><h1>Blindly</h1><div class="header-subtitle">see the beauty within</div></div><div class="content"><div class="greeting"><span>✨</span> Hi ${user.name || 'there'}!</div><p style="color: #4a3a6b; font-size: 16px;">We're reaching out to let you know about a change to your Blindly account.</p><div class="reason-box"><div class="reason-label">💜 Deactivation Reason</div><div class="reason-text">${reason || 'Account deactivated by administrator'}</div></div><div class="info-card"><div class="info-title"><span>🔍</span> What this means:</div><div class="info-text">• You can no longer log into your account</div><div class="info-text">• Your listings and activity are hidden</div><div class="info-text">• Your data is safely stored (for now)</div></div><div class="note"><div class="note-title">🌟 Think this is a mistake?</div><div class="note-text">We're here to help! Our support team is just a message away. Click the button below to appeal this decision.</div></div><div class="button-container"><a href="https://blindly.com/support/appeal?user=${user._id}" class="button">💬 Contact Support</a></div><hr><div style="text-align: center; margin: 20px 0;"><p style="color: #7c3aed; font-size: 15px; font-weight: 500;">Want to give Blindly another try?</p><p style="color: #4a3a6b; font-size: 14px;">You can create a new account anytime at<br><a href="https://blindly.com/signup" style="color: #7c3aed; text-decoration: underline; font-weight: 600;">blindly.com/signup</a></p></div></div><div class="footer"><div class="footer-icon">💜✨🦋</div><div class="footer-text">Blindly - where connections bloom</div><div class="footer-text" style="font-size: 12px;">123 Purple Lane, Imagination City, PC 12345</div><div class="social-links"><a href="#">📱</a><a href="#">💬</a><a href="#">📷</a><a href="#">🐦</a></div><hr style="margin: 15px 0;"><div class="footer-text" style="font-size: 11px; opacity: 0.7;">This email was sent to ${user.email}<br>© 2024 Blindly. All rights reserved. Made with 💜</div></div></div></body></html>`,
      text: `
        Hi ${user.name || 'there'},

        Your Blindly account has been deactivated.

        Reason: ${reason || 'Account deactivated by administrator'}

        What this means:
        - You can no longer log into your account
        - Your listings and activity are hidden
        - Your data is safely stored

        If you think this is a mistake, please contact our support team:
        https://blindly.com/support/appeal?user=${user._id}

        Want to give Blindly another try? Create a new account at:
        https://blindly.com/signup

        💜 Blindly Team
      `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[Delete] Email send error:', error);
      } else {
        console.log('[Delete] Deactivation email sent:', info.response);
      }
    });
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
    user.deliveryCity = "";
    user.deliveryZip = "";
    user.deliveryCountry = "";
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
