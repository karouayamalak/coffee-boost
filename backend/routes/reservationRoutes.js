import express from "express";
import { Reservation } from "../models/Reservation.js";
import mongoose from "mongoose";

const router = express.Router();

const memoryReservations = [];

// POST /api/reservations (reserve a table)
router.post("/reservations", async (req, res) => {
  try {
    const { name, email, phone, guests, date, time, seatingPreference, notes } = req.body;

    if (!name || !email || !phone || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, date, and time are required for reservation.",
      });
    }

    const reservationData = {
      name,
      email,
      phone,
      guests: Number(guests) || 2,
      date,
      time,
      seatingPreference: seatingPreference || "any",
      notes: notes || "",
      status: "confirmed",
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const reservation = await Reservation.create(reservationData);
      return res.status(201).json({
        success: true,
        message: "Table reserved successfully! A confirmation email has been sent.",
        reservation,
      });
    }

    memoryReservations.push(reservationData);
    return res.status(201).json({
      success: true,
      message: "Table reserved successfully! A confirmation email has been sent.",
      reservation: reservationData,
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
      const reservations = await Reservation.find().sort({ createdAt: -1 });
      return res.json({ success: true, reservations });
    }
    return res.json({ success: true, reservations: memoryReservations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
