const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  quantity: { type: Number, required: true, default: 1 },
});

orderItemSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

orderItemSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderItems: [orderItemSchema],
    shippingAddress1: { type: String, required: true },
    shippingAddress2: { type: String, default: "" },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, default: "pending" },
    subtotalPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", default: null },
    voucherClaim: { type: mongoose.Schema.Types.ObjectId, ref: "VoucherClaim", default: null },
    voucherName: { type: String, default: "" },
    voucherDiscountPercent: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dateOrdered: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

orderSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const Order = mongoose.model("Order", orderSchema);

// Drop stale order_id index if it exists (one-time fix)
Order.collection.dropIndex("order_id_1").catch(() => {
  // Index doesn't exist, that's fine
});

module.exports = Order;
