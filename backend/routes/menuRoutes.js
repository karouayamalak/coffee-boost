import express from "express";
import { MenuItem } from "../models/MenuItem.js";
import { Bean } from "../models/Bean.js";
import { initialMenuSections, initialBeans } from "../seed/data.js";
import mongoose from "mongoose";

const router = express.Router();

let memoryMenuItems = JSON.parse(JSON.stringify(initialMenuSections));
let memoryBeans = JSON.parse(JSON.stringify(initialBeans));

// GET /api/menu
router.get("/menu", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const items = await MenuItem.find({ available: true }).sort({ createdAt: 1 });
      if (items.length > 0) {
        // Group by category while preserving default category ordering
        const predefinedCategories = [
          "Drinks & Specialty Brews",
          "Desserts, Cakes & Bakery",
          "Savory & Breakfast Plates",
        ];
        const allCategories = [
          ...new Set([
            ...predefinedCategories,
            ...items.map((i) => i.category || "Other"),
          ]),
        ];

        const grouped = allCategories
          .map((cat) => ({
            title: cat,
            items: items.filter((i) => (i.category || "Other") === cat),
          }))
          .filter((section) => section.items.length > 0);

        return res.json({ success: true, sections: grouped });
      }
    }
    return res.json({ success: true, sections: memoryMenuItems });
  } catch (error) {
    console.warn("Notice fetching menu from DB, returning cache:", error.message);
    return res.json({ success: true, sections: memoryMenuItems });
  }
});

// GET /api/beans
router.get("/beans", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const beans = await Bean.find({ inStock: true });
      if (beans.length > 0) {
        return res.json({ success: true, beans });
      }
    }
    return res.json({ success: true, beans: memoryBeans });
  } catch (error) {
    return res.json({ success: true, beans: memoryBeans });
  }
});

// POST /api/menu (Owner adds a new product)
router.post("/menu", async (req, res) => {
  try {
    const { name, note, price, category, badge, image } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, price, and category are required." });
    }

    const itemData = {
      name: name.trim(),
      note: note || "",
      price: Number(price),
      category: category.trim(),
      badge: badge || "",
      image: image || "",
      available: true,
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const newItem = await MenuItem.create(itemData);
        return res.status(201).json({ success: true, item: newItem, message: "Product added successfully!" });
      } catch (dbErr) {
        console.warn("DB create item error, adding to memory:", dbErr.message);
      }
    }

    const newItem = { id: `m_${Date.now()}`, ...itemData };
    const secIndex = memoryMenuItems.findIndex((s) => s.title.toLowerCase() === category.toLowerCase());
    if (secIndex >= 0) {
      memoryMenuItems[secIndex].items.push(newItem);
    } else {
      memoryMenuItems.push({ title: category, items: [newItem] });
    }
    return res.status(201).json({ success: true, item: newItem, message: "Product added to menu!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/menu/:id (Owner deletes a product)
router.delete("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      try {
        await MenuItem.findByIdAndDelete(id);
        return res.json({ success: true, message: "Product removed from menu" });
      } catch (dbErr) {
        console.warn("DB delete item error:", dbErr.message);
      }
    }

    memoryMenuItems.forEach((sec) => {
      sec.items = sec.items.filter((item) => item.id !== id && item._id !== id);
    });

    return res.json({ success: true, message: "Product removed from menu" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
