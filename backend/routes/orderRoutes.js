import express from "express";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

const memoryOrders = [];

// POST /api/orders (create a new order)
router.post("/orders", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      total,
      pickupTime,
      paymentMethod,
      specialInstructions,
    } = req.body;

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone number, and at least one item are required.",
      });
    }

    const orderNumber = `BC-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderData = {
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: (customerEmail || "").trim(),
      items: items.map((i) => ({
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity) || 1,
        note: i.note || "",
        image: i.image || "",
      })),
      total: Number(total) || items.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0),
      pickupTime: pickupTime || "As soon as ready (15-20 min)",
      paymentMethod: paymentMethod || "Cash on pickup",
      status: "pending",
      specialInstructions: specialInstructions || "",
      createdAt: new Date(),
    };

    const db = await getDB();
    if (db) {
      try {
        const result = await db.collection("orders").insertOne(orderData);
        const createdOrder = { ...orderData, _id: result.insertedId };
        console.log(`✅ Order ${orderNumber} persisted to MongoDB Atlas!`);
        return res.status(201).json({
          success: true,
          message: "Order placed successfully!",
          order: createdOrder,
        });
      } catch (dbErr) {
        console.error("DB insert error, using fallback:", dbErr.message);
      }
    }

    // In-memory fallback
    const memoryItem = { ...orderData, _id: `ord_${Date.now()}` };
    memoryOrders.unshift(memoryItem);
    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: memoryItem,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders (retrieve orders for Owner Dashboard)
router.get("/orders", async (req, res) => {
  try {
    const db = await getDB();
    if (db) {
      try {
        const orders = await db.collection("orders").find().sort({ createdAt: -1 }).toArray();
        return res.json({ success: true, orders, dbConnected: true });
      } catch (dbErr) {
        console.error("DB find orders error:", dbErr.message);
      }
    }
    return res.json({ success: true, orders: memoryOrders, dbConnected: false });
  } catch (error) {
    console.warn("Orders endpoint fallback:", error.message);
    return res.json({ success: true, orders: memoryOrders, dbConnected: false });
  }
});

// PATCH /api/orders/:id/status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "preparing", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const db = await getDB();
    if (db) {
      try {
        let filter;
        if (ObjectId.isValid(id)) {
          filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] };
        } else {
          filter = { orderNumber: id };
        }
        const updated = await db
          .collection("orders")
          .findOneAndUpdate(filter, { $set: { status } }, { returnDocument: "after" });
        if (updated) return res.json({ success: true, order: updated });
      } catch (dbErr) {
        console.warn("DB update status fallback:", dbErr.message);
      }
    }

    const order = memoryOrders.find((o) => o._id === id || o.orderNumber === id);
    if (order) {
      order.status = status;
      return res.json({ success: true, order });
    }

    return res.status(404).json({ success: false, message: "Order not found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/orders/:id
router.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    if (db) {
      try {
        let filter;
        if (ObjectId.isValid(id)) {
          filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] };
        } else {
          filter = { orderNumber: id };
        }
        await db.collection("orders").deleteOne(filter);
        return res.json({ success: true, message: "Order deleted from database" });
      } catch (dbErr) {
        console.warn("DB delete fallback:", dbErr.message);
      }
    }
    const idx = memoryOrders.findIndex((o) => o._id === id || o.orderNumber === id);
    if (idx >= 0) memoryOrders.splice(idx, 1);
    return res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/stats (Owner Dashboard metrics)
router.get("/stats", async (req, res) => {
  try {
    const db = await getDB();
    if (db) {
      try {
        const orders = await db.collection("orders").find().toArray();
        const reservationsCount = await db.collection("reservations").countDocuments();

        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        return res.json({
          success: true,
          stats: {
            totalOrders,
            pendingOrders,
            totalRevenue,
            reservationsCount,
          },
        });
      } catch (dbErr) {
        console.warn("DB stats error, using memory:", dbErr.message);
      }
    }

    return res.json({
      success: true,
      stats: {
        totalOrders: memoryOrders.length,
        pendingOrders: memoryOrders.filter((o) => o.status === "pending" || o.status === "preparing").length,
        totalRevenue: memoryOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        reservationsCount: 0,
      },
    });
  } catch (error) {
    console.warn("Stats endpoint fallback:", error.message);
    return res.json({
      success: true,
      stats: {
        totalOrders: memoryOrders.length,
        pendingOrders: memoryOrders.filter((o) => o.status === "pending" || o.status === "preparing").length,
        totalRevenue: memoryOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        reservationsCount: 0,
      },
    });
  }
});

export default router;
