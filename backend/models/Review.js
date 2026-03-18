const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    images: [{ type: String }],
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    deletionReason: { type: String, default: "" },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret._id; delete ret.__v; return ret; },
    },
  }
);

reviewSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// One review per user per product
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
