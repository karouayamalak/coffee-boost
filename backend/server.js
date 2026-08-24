import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, getDBStatus } from "./config/db.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
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

// Allow up to 50mb JSON payloads for image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connection notice:", err.message);
  }
  next();
});

// Health check endpoint
app.get(["/api/health", "/health"], (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: "ok",
    app: "Boost Coffee Shop API",
    version: "1.0.0",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes mounted on both /api and / for compatibility with all serverless rewrites
app.use("/api", menuRoutes);
app.use("/api", orderRoutes);
app.use("/api", reservationRoutes);
app.use("/api", contactRoutes);
app.use("/api", uploadRoutes);

app.use(menuRoutes);
app.use(orderRoutes);
app.use(reservationRoutes);
app.use(contactRoutes);
app.use(uploadRoutes);

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
      "/api/upload",
    ],
  });
});

// Start local dev server if not in Vercel serverless environment
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`☕ Boost Coffee Backend running on http://localhost:${PORT}`);
    });
  });
}

export default app;
