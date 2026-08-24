import express from "express";
import { Reservation } from "../models/Reservation.js";
import mongoose from "mongoose";

const router = express.Router();

const memoryReservations = [];

// POST /api/reservations
router.post("/reservations", async (req, res) => {
  try {
    const { name, email, phone, guests, date, time, seatingPreference, notes } = req.body;

    if (!name || !email || !phone || !guests || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, guests, date, and time are required.",
      });
    }

    const reservationData = {
      name,
      email,
      phone,
      guests: Number(guests),
      date: new Date(date),
      time,
      seatingPreference: seatingPreference || "any",
      notes: notes || "",
      status: "confirmed",
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const reservation = await Reservation.create(reservationData);
        return res.status(201).json({
          success: true,
          message: "Reservation confirmed successfully!",
          reservation,
        });
      } catch (dbErr) {
        console.warn("DB reservation error, using memory fallback:", dbErr.message);
      }
    }

    const memoryItem = { ...reservationData, _id: `res_${Date.now()}` };
    memoryReservations.unshift(memoryItem);
    return res.status(201).json({
      success: true,
      message: "Reservation confirmed successfully!",
      reservation: memoryItem,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reservations
router.get("/reservations", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const reservations = await Reservation.find().sort({ createdAt: -1 });
        return res.json({ success: true, reservations });
      } catch (dbErr) {
        console.warn("DB find reservations error:", dbErr.message);
      }
    }
    return res.json({ success: true, reservations: memoryReservations });
  } catch (error) {
    return res.json({ success: true, reservations: memoryReservations });
  }
});

export default router;
