import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String },
    type: { type: String, enum: ["inquiry", "newsletter"], default: "inquiry" },
  },
  { timestamps: true }
);

export const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);
