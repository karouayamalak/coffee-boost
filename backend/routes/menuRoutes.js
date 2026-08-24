import express from "express";
import { MenuItem } from "../models/MenuItem.js";
import { Bean } from "../models/Bean.js";
import { initialMenuSections, initialBeans } from "../seed/data.js";
import mongoose from "mongoose";

const router = express.Router();

let memoryMenuItems = initialMenuSections;
let memoryBeans = initialBeans;

// GET /api/menu
router.get("/menu", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const items = await MenuItem.find({ available: true });
      if (items.length > 0) {
        const categories = [...new Set(items.map((i) => i.category || "Other"))];
        const grouped = categories.map((cat) => ({
          title: cat,
          items: items.filter((i) => (i.category || "Other") === cat),
        }));
        return res.json({ success: true, sections: grouped });
      }
    }
    return res.json({ success: true, sections: memoryMenuItems });
  } catch (error) {
    console.error("Error fetching menu:", error);
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
    console.error("Error fetching beans:", error);
    return res.json({ success: true, beans: memoryBeans });
  }
});

// POST /api/menu
router.post("/menu", async (req, res) => {
  try {
    const { name, note, price, category, badge } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (mongoose.connection.readyState === 1) {
      const newItem = await MenuItem.create({ name, note, price: Number(price), category, badge });
      return res.status(201).json({ success: true, item: newItem });
    }

    const newItem = { id: `m_${Date.now()}`, name, note, price: Number(price), category, badge };
    const secIndex = memoryMenuItems.findIndex((s) => s.title.toLowerCase() === category.toLowerCase());
    if (secIndex >= 0) {
      memoryMenuItems[secIndex].items.push(newItem);
    } else {
      memoryMenuItems.push({ title: category, items: [newItem] });
    }
    return res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
