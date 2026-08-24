import express from "express";
import { getDB } from "../config/db.js";
import { initialMenuSections, initialBeans } from "../seed/data.js";
import { ObjectId } from "mongodb";

const router = express.Router();

let memoryMenuItems = JSON.parse(JSON.stringify(initialMenuSections));
let memoryBeans = JSON.parse(JSON.stringify(initialBeans));

// GET /api/menu
router.get("/menu", async (req, res) => {
  try {
    const db = await getDB();
    if (db) {
      const items = await db.collection("menuitems").find({ available: true }).sort({ createdAt: 1 }).toArray();
      if (items.length > 0) {
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
    const db = await getDB();
    if (db) {
      const beans = await db.collection("beans").find({ inStock: true }).toArray();
      if (beans.length > 0) {
        return res.json({ success: true, beans });
      }
    }
    return res.json({ success: true, beans: memoryBeans });
  } catch (error) {
    return res.json({ success: true, beans: memoryBeans });
  }
});

// POST /api/menu (add custom item via Owner Dashboard)
router.post("/menu", async (req, res) => {
  try {
    const { name, note, price, category, badge, image } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and category are required.",
      });
    }

    const newItemData = {
      name: name.trim(),
      note: (note || "").trim(),
      price: Number(price),
      category: category.trim(),
      badge: (badge || "").trim(),
      image: (image || "").trim(),
      available: true,
      createdAt: new Date(),
    };

    const db = await getDB();
    if (db) {
      const result = await db.collection("menuitems").insertOne(newItemData);
      return res.status(201).json({
        success: true,
        message: "Product added successfully to database!",
        item: { ...newItemData, _id: result.insertedId },
      });
    }

    // In-memory fallback
    const targetSection = memoryMenuItems.find((s) => s.title === category);
    const newMemoryItem = { ...newItemData, id: `custom_${Date.now()}` };
    if (targetSection) {
      targetSection.items.push(newMemoryItem);
    } else {
      memoryMenuItems.push({
        title: category,
        items: [newMemoryItem],
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product added successfully (in-memory mode)",
      item: newMemoryItem,
    });
  } catch (error) {
    console.error("Error adding menu item:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/menu/:id (remove custom item via Owner Dashboard)
router.delete("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    if (db) {
      let filter;
      if (ObjectId.isValid(id)) {
        filter = { _id: new ObjectId(id) };
      } else {
        filter = { name: id };
      }
      await db.collection("menuitems").deleteOne(filter);
      return res.json({ success: true, message: "Product deleted from database" });
    }

    // In-memory fallback
    memoryMenuItems.forEach((section) => {
      section.items = section.items.filter((i) => i.id !== id && i.name !== id);
    });

    return res.json({ success: true, message: "Product deleted from memory" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
