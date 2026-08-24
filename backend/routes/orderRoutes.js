import express from "express";
import { Order } from "../models/Order.js";
import { Reservation } from "../models/Reservation.js";
import mongoose from "mongoose";

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
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
      items,
      total: Number(total) || items.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0),
      pickupTime: pickupTime || "As soon as ready (15-20 min)",
      paymentMethod: paymentMethod || "Cash on pickup",
      status: "pending",
      specialInstructions: specialInstructions || "",
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const order = await Order.create(orderData);
      return res.status(201).json({
        success: true,
        message: "Order placed successfully!",
        order,
      });
    }

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
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    }
    return res.json({ success: true, orders: memoryOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status (update order status: preparing, ready, completed, cancelled)
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "preparing", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      return res.json({ success: true, order });
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
    if (mongoose.connection.readyState === 1) {
      await Order.findByIdAndDelete(id);
      return res.json({ success: true, message: "Order deleted" });
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
    let orders = [];
    let reservationsCount = 0;

    if (mongoose.connection.readyState === 1) {
      orders = await Order.find();
      reservationsCount = await Reservation.countDocuments();
    } else {
      orders = memoryOrders;
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalRevenue,
        reservationsCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
