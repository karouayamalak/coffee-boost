import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    note: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Espresso", "Filter & cold", "Bakes", "Specialty"],
    },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MenuItem =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
