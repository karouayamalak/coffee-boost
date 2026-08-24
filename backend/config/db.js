import dns from "dns";

// Force reliable DNS for Node.js SRV resolution
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore if not supported in environment
}

import mongoose from "mongoose";

let cachedPromise = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  cachedPromise = mongoose
    .connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return true;
    })
    .catch((error) => {
      console.warn(`⚠️ MongoDB connection fallback (${error.message}). Operating in in-memory mode.`);
      cachedPromise = null;
      return false;
    });

  return cachedPromise;
}

export function getDBStatus() {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    connected: isConnected,
    mode: isConnected ? "MongoDB Atlas" : "In-Memory Datastore",
  };
}
