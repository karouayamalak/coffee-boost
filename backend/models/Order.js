import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, trim: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    pickupTime: { type: String, default: "As soon as ready (15-20 min)" },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    specialInstructions: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
