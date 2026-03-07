const express = require("express");
const authJwt = require("../middleware/authJwt");
const User = require("../models/User");
const { sendToTokens } = require("../services/notifications");

const router = express.Router();

// POST /notifications/broadcast — admin only, send promo to all users with a push token
router.post("/broadcast", authJwt, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { title, body, details } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }
    if (!body || !String(body).trim()) {
      return res.status(400).json({ message: "body is required" });
    }

    // Fetch all users who have at least one push token
    const users = await User.find(
      { "pushTokens.0": { $exists: true } },
      "pushTokens"
    ).lean();

    const tokens = users.flatMap((u) =>
      (u.pushTokens || []).map((t) => ({ token: t.token, type: t.type }))
    );

    if (tokens.length === 0) {
      return res.status(200).json({ sent: 0, message: "No registered push tokens found" });
    }

    await sendToTokens(tokens, {
      title: String(title).trim(),
      body: String(body).trim(),
      data: {
        type: "promo",
        title: String(title).trim(),
        body: String(body).trim(),
        details: String(details || "").trim(),
      },
    });

    return res.status(200).json({
      sent: tokens.length,
      message: `Promo notification sent to ${tokens.length} user(s)`,
    });
  } catch (err) {
    console.error("[broadcast] error:", err.message);
    return res.status(500).json({ message: "Failed to send notification" });
  }
});

module.exports = router;
