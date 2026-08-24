import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    guests: { type: Number, required: true, min: 1, max: 20, default: 2 },
    date: { type: String, required: true },
    time: { type: String, required: true },
    seatingPreference: {
      type: String,
      enum: ["indoor", "terrace", "bar_counter", "any"],
      default: "any",
    },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

export const Reservation =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);
