import mongoose from "mongoose";

const beanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    note: { type: String, required: true },
    roast: { type: String, required: true, enum: ["Light", "Medium", "Dark"] },
    price: { type: Number, required: true, default: 14.0 },
    weight: { type: String, default: "250g" },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Bean =
  mongoose.models.Bean || mongoose.model("Bean", beanSchema);
