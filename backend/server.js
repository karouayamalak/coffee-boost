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
    origin: [
      "http://localhost:8080",
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.CLIENT_URL,
      /\.vercel\.app$/,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());

// Auto-seed MongoDB with initial Boost Coffee items if connected
async function seedInitialData() {
  if (mongoose.connection.readyState !== 1) return;
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
  } catch (err) {
    console.error("Error seeding initial data:", err);
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
      "/api/reservations",
      "/api/contact",
    ],
  });
});

// Start server
async function startServer() {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`☕ Boost Coffee Backend running on http://localhost:${PORT}`);
    console.log(`🚀 Health check at http://localhost:${PORT}/api/health`);
  });
}

startServer();

export default app;
