const mongoose = require("mongoose");

const promoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

promoSchema.index({ product: 1, isActive: 1, startsAt: 1, endsAt: 1 });

promoSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

promoSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Promo", promoSchema);
