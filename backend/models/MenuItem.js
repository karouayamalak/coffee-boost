import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      default: "Drinks & Specialty Brews",
    },
    image: { type: String, default: "" },
    badge: { type: String, default: "" },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MenuItem =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
