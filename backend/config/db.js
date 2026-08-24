import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.log("ℹ️ MONGODB_URI not provided. Running in memory-store mode.");
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection skipped (${error.message}). Operating in high-speed memory mode.`);
    isConnected = false;
    return false;
  }
}

export function getDBStatus() {
  return {
    connected: isConnected,
    mode: isConnected ? "MongoDB" : "In-Memory Datastore",
  };
}
