const express = require("express");
const https = require("https");
const jwt = require("jsonwebtoken");
const config = require("../config");
const authJwt = require("../middleware/authJwt");
const User = require("../models/User");
const Order = require("../models/Order");
const { sendToTokens } = require("../services/notifications");

const router = express.Router();

// Expo token regex
const expoTokenRegex = /^ExponentPushToken\[[\w-]+\]$/;

// PUT: Register push token
router.put('/user/:userId/push-token', authJwt, async (req, res) => {
  const { userId } = req.params;
  const { pushToken } = req.body;
  const requesterId = req.user.id;
  const requesterIsAdmin = req.user.role === 'admin';

  if (!pushToken || !expoTokenRegex.test(pushToken)) {
    return res.status(400).json({ error: 'Invalid Expo push token.' });
  }

  if (requesterId !== userId && !requesterIsAdmin) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.pushToken = pushToken;
    await user.save();
    return res.json({ success: true, pushToken });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE: Remove push token
router.delete('/user/:userId/push-token', authJwt, async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  const requesterIsAdmin = req.user.role === 'admin';

  if (requesterId !== userId && !requesterIsAdmin) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.pushToken = undefined;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

function detectSupportIntent(message) {
  const text = String(message || "").toLowerCase();

  if (/(track|where|status|late|delay).*(order)|order.*(track|status|where|late|delay)/.test(text)) {
    return "order_tracking";
  }
  if (/(cancel|refund|return)/.test(text)) {
    return "order_changes";
  }
  if (/(voucher|discount|promo|coupon)/.test(text)) {
    return "voucher";
  }
  if (/(payment|gcash|card|cash|cod|checkout)/.test(text)) {
    return "checkout_payment";
  }
  if (/(address|delivery|phone|profile|account|password|login|otp)/.test(text)) {
    return "account_system";
  }
  if (/(notification|push|alert|not receive|not getting)/.test(text)) {
    return "notification_system";
  }
  return "general";
}

function buildSuggestionsForIntent(intent) {
  const byIntent = {
    order_tracking: [
      "Show me steps to track my latest order",
      "How do I find my order ID?",
      "What does shipped status mean?",
    ],
    order_changes: [
      "Can I cancel a pending order?",
      "How do refunds work for cancelled orders?",
      "What if my order is already shipped?",
    ],
    voucher: [
      "Why is my voucher not applying?",
      "Where can I claim vouchers?",
      "Do vouchers expire?",
    ],
    checkout_payment: [
      "My payment failed, what should I do?",
      "Which payment methods are available?",
      "How do I complete checkout?",
    ],
    account_system: [
      "How can I update my delivery address?",
      "How do I change account details?",
      "Where can I update my phone number?",
    ],
    notification_system: [
      "Why am I not receiving order notifications?",
      "How do I enable push notifications?",
      "How can I open order details from a notification?",
    ],
    general: [
      "Help me track an order",
      "Help with checkout and payment",
      "Help with vouchers",
    ],
  };

  return byIntent[intent] || byIntent.general;
}

function statusLabel(status) {
  const lowered = String(status || "").toLowerCase();
  if (lowered === "3") return "pending";
  if (lowered === "2") return "shipped";
  if (lowered === "1") return "delivered";
  return lowered || "unknown";
}

function extractAuthUser(req) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;
    return jwt.verify(token, config.jwtSecret);
  } catch (_error) {
    return null;
  }
}

function extractOrderIdFromMessage(message) {
  const text = String(message || "");
  const match = text.match(/(?:order\s*(?:id|#)?\s*[:\-]?\s*)([a-f0-9]{8,24})/i);
  return match ? String(match[1]) : "";
}

async function loadRecentOrdersForUser(userId) {
  if (!userId) return [];

  const rows = await Order.find({ user: userId })
    .sort({ dateOrdered: -1 })
    .limit(5)
    .select("status totalPrice dateOrdered")
    .lean();

  return rows.map((o) => ({
    id: String(o._id),
    status: statusLabel(o.status),
    totalPrice: Number(o.totalPrice || 0),
    dateOrdered: o.dateOrdered,
  }));
}

function buildOrderSnapshotText(orders) {
  if (!orders || orders.length === 0) {
    return "No recent orders found for this user.";
  }

  const lines = orders.map((o) => {
    const shortId = o.id.slice(-8);
    return `#${shortId} | status: ${o.status} | total: ${o.totalPrice}`;
  });
  return `Recent orders:\n${lines.join("\n")}`;
}

function buildFallbackReply(message, options = {}) {
  const text = String(message || "").toLowerCase();
  const intent = options.intent || detectSupportIntent(message);
  const recentOrders = Array.isArray(options.recentOrders) ? options.recentOrders : [];
  const mentionedOrderId = options.mentionedOrderId || "";

  if (intent === "order_tracking") {
    const matchedOrder = mentionedOrderId
      ? recentOrders.find((o) => o.id.toLowerCase() === mentionedOrderId.toLowerCase())
      : recentOrders[0];

    if (matchedOrder) {
      return [
        `I found a recent order (${matchedOrder.id.slice(-8)}) with status ${matchedOrder.status}.`,
        "Open My Orders, tap that order, then check timeline and item details.",
        "If it looks stuck for too long, share the full order ID and I can guide escalation steps."
      ].join(" ");
    }
  }

  if (/(track|where|status).*(order)|order.*(track|status|where)/.test(text)) {
    return [
      "You can track your order in My Orders.",
      "Open the order to view status updates like pending, shipped, delivered, or cancelled.",
      "If it is delayed, send your order ID and I will walk you through next steps."
    ].join(" ");
  }

  if (/(voucher|discount|promo|coupon)/.test(text)) {
    return [
      "Claim vouchers from the Home page voucher carousel.",
      "At checkout, choose an eligible claimed voucher to apply discount.",
      "Check category restrictions and expiration to avoid invalid claims."
    ].join(" ");
  }

  if (/(cancel|refund|return)/.test(text)) {
    return [
      "Cancellation and refund options depend on order state.",
      "Go to My Orders and open the order details to see available actions.",
      "If no action appears, share your order ID so we can verify the current status and options."
    ].join(" ");
  }

  if (/(payment|gcash|card|cash|cod)/.test(text)) {
    return [
      "Payment methods are selected during checkout.",
      "If payment fails, retry with stable connection and verify account/balance limits.",
      "If the first attempt timed out, check My Orders first before placing a duplicate order."
    ].join(" ");
  }

  if (/(address|delivery|phone|profile|account|password|login|otp)/.test(text)) {
    return [
      "For account and delivery profile issues, open your Profile screen and update required fields.",
      "If checkout blocks order placement, make sure phone, address, city, zip, and country are complete.",
      "Tell me the exact error text and I can give targeted troubleshooting."
    ].join(" ");
  }

  if (/(notification|push|alert|not receive|not getting)/.test(text)) {
    return [
      "For missing notifications, ensure app notifications are enabled in device settings.",
      "Re-open the app while online so push token registration can refresh.",
      "You can still check all updates from My Orders and Notification Center."
    ].join(" ");
  }

  return [
    "I can help with order tracking, order issues, checkout, vouchers, payment problems, and app/account settings.",
    "Share details like order ID, current status, and the exact error message for faster help.",
    "I can guide you step-by-step for both order concerns and system/app concerns."
  ].join(" ");
}

function callOpenAiChat(messages) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: config.openAiModel || "gpt-4o-mini",
      temperature: 0.5,
      messages,
    });

    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Authorization: `Bearer ${config.openAiApiKey}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data || "{}");
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(parsed?.error?.message || "AI request failed"));
            }
            const text = parsed?.choices?.[0]?.message?.content;
            if (!text || !String(text).trim()) {
              return reject(new Error("No AI response content"));
            }
            return resolve(String(text).trim());
          } catch (err) {
            return reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// POST /notifications/chat-assistant — AI assistant for help chat (fallback supported)
router.post("/chat-assistant", async (req, res) => {
  try {
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const compactHistory = history
      .filter((m) => (m?.role === "user" || m?.role === "assistant") && m?.content)
      .slice(-10)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 600) }));

    const requestUser = extractAuthUser(req);
    const recentOrders = await loadRecentOrdersForUser(requestUser?.userId);
    const intent = detectSupportIntent(message);
    const mentionedOrderId = extractOrderIdFromMessage(message);
    const suggestions = buildSuggestionsForIntent(intent);

    const systemPrompt = {
      role: "system",
      content:
        "You are Blindly Order and System Support Assistant. " +
        "Your scope is only: order tracking/issues, checkout, voucher usage, payment problems, account/profile settings, and app/notification issues. " +
        "Never answer unrelated topics; politely redirect to supported scope. " +
        "Respond like a support chatbot: acknowledge briefly, then provide clear steps. " +
        "When available, use the provided recent order context. " +
        "If uncertain, say so and give safe next actions.",
    };

    const supportContextMessage = {
      role: "system",
      content:
        `Detected intent: ${intent}. ` +
        `${buildOrderSnapshotText(recentOrders)} ` +
        "If user asks order status and no ID was provided, use most recent order as likely reference but mention assumption.",
    };

    const chatMessages = [systemPrompt, supportContextMessage, ...compactHistory, { role: "user", content: message }];

    if (!config.openAiApiKey) {
      return res.status(200).json({
        source: "fallback",
        focus: "orders_system",
        suggestions,
        reply: buildFallbackReply(message, { intent, recentOrders, mentionedOrderId }),
      });
    }

    try {
      const aiReply = await callOpenAiChat(chatMessages);
      return res.status(200).json({
        source: "openai",
        focus: "orders_system",
        suggestions,
        reply: aiReply,
      });
    } catch (_e) {
      return res.status(200).json({
        source: "fallback",
        focus: "orders_system",
        suggestions,
        reply: buildFallbackReply(message, { intent, recentOrders, mentionedOrderId }),
      });
    }
  } catch (_err) {
    return res.status(500).json({ message: "Failed to process chat request" });
  }
});

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
