const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    dateCreated: { type: Date, default: Date.now },
    dateExpirationShop: { type: Date, required: true },
    dateExpirationAfterClaimDays: { type: Number, required: true, min: 1 },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    appliesTo: { type: String, enum: ["all", "category"], default: "all" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

voucherSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

voucherSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Voucher", voucherSchema);
