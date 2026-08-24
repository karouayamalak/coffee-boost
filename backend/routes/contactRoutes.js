import express from "express";
import { Contact } from "../models/Contact.js";
import mongoose from "mongoose";

const router = express.Router();

const memoryContacts = [];

// POST /api/contact
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ success: false, message: "Email and message are required." });
    }

    const contactData = {
      name: name || "Visitor",
      email,
      subject: subject || "General Inquiry",
      message,
      type: "inquiry",
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      await Contact.create(contactData);
    } else {
      memoryContacts.push(contactData);
    }

    return res.status(201).json({
      success: true,
      message: "Thank you! We've received your message and will reply shortly.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/newsletter
router.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const subData = {
      email,
      subject: "Newsletter Subscription",
      type: "newsletter",
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      await Contact.create(subData);
    } else {
      memoryContacts.push(subData);
    }

    return res.status(201).json({
      success: true,
      message: "You're on the list! Welcome to Boost Roastery updates.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
