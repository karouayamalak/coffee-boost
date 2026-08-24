import mongoose from "mongoose";

// Direct non-SRV connection string (never fails with querySrv ECONNREFUSED)
export const DIRECT_MONGO_URI =
  "mongodb://akarou_db_user:hOVfINhbMp9mT5WF@ac-bewj1mn-shard-00-00.yjsxuri.mongodb.net:27017,ac-bewj1mn-shard-00-01.yjsxuri.mongodb.net:27017,ac-bewj1mn-shard-00-02.yjsxuri.mongodb.net:27017/boost_coffee?ssl=true&replicaSet=atlas-6z4lcm-shard-0&authSource=admin&retryWrites=true&w=majority";

let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || DIRECT_MONGO_URI;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log(`✅ MongoDB Atlas Connected: ${m.connection.host || "replicaSet"}`);
        cached.conn = m;
        return m;
      })
      .catch(async (err) => {
        console.warn(`⚠️ Primary URI failed (${err.message}). Trying direct replica set string...`);
        // Fallback to direct replica set URI
        return mongoose
          .connect(DIRECT_MONGO_URI, opts)
          .then((m) => {
            console.log("✅ MongoDB Atlas Connected via Direct Replica Set!");
            cached.conn = m;
            return m;
          })
          .catch((err2) => {
            console.error(`❌ Both MongoDB connections failed: ${err2.message}`);
            cached.promise = null;
            cached.conn = null;
            return null;
          });
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

export async function getDB() {
  await connectDB();
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    return mongoose.connection.db;
  }
  return null;
}

export function getDBStatus() {
  const isConnected = mongoose.connection.readyState === 1;
  return {
    connected: isConnected,
    mode: isConnected ? "MongoDB Atlas" : "In-Memory Datastore",
  };
}
