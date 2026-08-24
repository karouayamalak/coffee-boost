import mongoose from "mongoose";

const DEFAULT_URI =
  "mongodb+srv://akarou_db_user:hOVfINhbMp9mT5WF@coffee-boost.yjsxuri.mongodb.net/boost_coffee?retryWrites=true&w=majority&appName=coffee-boost";

// Global cache across serverless function invocations
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB Atlas Connected: ${mongooseInstance.connection.host}`);
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        cached.promise = null;
        cached.conn = null;
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
  }

  return cached.conn;
}

export function getDBStatus() {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    connected: isConnected,
    mode: isConnected ? "MongoDB Atlas" : "In-Memory Datastore",
  };
}
