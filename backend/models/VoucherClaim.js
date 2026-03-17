const mongoose = require("mongoose");

const voucherClaimSchema = new mongoose.Schema(
  {
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    claimedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    status: { type: String, enum: ["claimed", "used", "expired"], default: "claimed" },
  },
  { timestamps: true }
);

voucherClaimSchema.index({ voucher: 1, user: 1 }, { unique: true });

voucherClaimSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

voucherClaimSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("VoucherClaim", voucherClaimSchema);
