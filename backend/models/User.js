const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
   passwordHash: { type: String, required: false, default: '' },
phone: { type: String, required: false, default: '', trim: true },
    image: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    deliveryAddress1: { type: String, default: "" },
    deliveryAddress2: { type: String, default: "" },
    deliveryRegion: { type: String, default: "" },
    deliveryCity: { type: String, default: "" },
    deliveryZip: { type: String, default: "" },
    deliveryCountry: { type: String, default: "Philippines" },
    deliveryLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    pushTokens: [
      {
        token: { type: String, required: true },
        type: { type: String, enum: ["fcm", "expo", "unknown"], default: "unknown" },
      },
    ],
    favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },
    emailVerifiedAt: { type: Date, default: null },
    accountStatus: { type: String, enum: ["active", "deactivated", "deleted"], default: "active" },
    accountStatusReason: { type: String, default: "" },
    accountStatusUpdatedAt: { type: Date, default: null },
    deactivatedUntil: { type: Date, default: null },
    firebaseUid: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.hasPassword = Boolean(ret.passwordHash);
    delete ret._id;
    delete ret.passwordHash;
    delete ret.pushTokens;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
