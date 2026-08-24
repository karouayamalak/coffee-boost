import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, getDBStatus } from "./config/db.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { MenuItem } from "./models/MenuItem.js";
import { Bean } from "./models/Bean.js";
import { initialMenuSections, initialBeans } from "./seed/data.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connection notice:", err.message);
  }
  next();
});

// Auto-seed MongoDB with initial Boost Coffee items if connected
let hasSeeded = false;
async function seedInitialData() {
  if (hasSeeded || mongoose.connection.readyState !== 1) return;
  try {
    const sampleItem = await MenuItem.findOne();
    if (!sampleItem || sampleItem.price < 50) {
      console.log("🌱 Syncing Boost Coffee menu with Algerian Dinar (DA) prices...");
      await MenuItem.deleteMany({});
      for (const section of initialMenuSections) {
        for (const item of section.items) {
          await MenuItem.create({
            name: item.name,
            note: item.note,
            price: item.price,
            category: section.title,
          });
        }
      }
    }

    const sampleBean = await Bean.findOne();
    if (!sampleBean || sampleBean.price < 100) {
      console.log("🌱 Syncing Boost Coffee shelf beans with Algerian Dinar (DA) prices...");
      await Bean.deleteMany({});
      for (const bean of initialBeans) {
        await Bean.create(bean);
      }
    }
    hasSeeded = true;
  } catch (err) {
    console.warn("Notice seeding initial data:", err.message);
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: "ok",
    app: "Boost Coffee Shop API",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", menuRoutes);
app.use("/api", orderRoutes);
app.use("/api", reservationRoutes);
app.use("/api", contactRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Boost Coffee Shop API ☕",
    routes: [
      "/api/health",
      "/api/menu",
      "/api/beans",
      "/api/orders",
      "/api/stats",
      "/api/reservations",
      "/api/contact",
    ],
  });
});

// Start local dev server if not in Vercel serverless environment
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  connectDB().then(() => {
    seedInitialData();
    app.listen(PORT, () => {
      console.log(`☕ Boost Coffee Backend running on http://localhost:${PORT}`);
    });
  });
}

export default app;
