import dns from "dns";
// Force reliable public DNS for Node.js SRV resolution
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore if not supported in environment
}

import mongoose from "mongoose";
import dotenv from "dotenv";
import { MenuItem } from "../models/MenuItem.js";
import { Bean } from "../models/Bean.js";
import { initialMenuSections, initialBeans } from "./data.js";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb+srv://akarou_db_user:hOVfINhbMp9mT5WF@coffee-boost.yjsxuri.mongodb.net/boost_coffee?retryWrites=true&w=majority&appName=coffee-boost";

async function seedDatabase() {
  console.log("🔌 Connecting to MongoDB Atlas...");
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB Atlas successfully!");

    console.log("🗑️ Clearing old menu items...");
    await MenuItem.deleteMany({});
    await Bean.deleteMany({});

    console.log("🌱 Inserting 19 researched menu items with their static image URLs into MongoDB...");
    for (const section of initialMenuSections) {
      for (const item of section.items) {
        await MenuItem.create({
          name: item.name,
          note: item.note,
          price: item.price,
          category: section.title,
          badge: item.badge || "",
          image: item.image || "",
          available: true,
        });
      }
    }

    console.log("🌱 Inserting 3 shelf beans into MongoDB...");
    for (const bean of initialBeans) {
      await Bean.create(bean);
    }

    const totalInDB = await MenuItem.countDocuments();
    const withImages = await MenuItem.countDocuments({ image: { $ne: "" } });
    console.log(`🎉 SUCCESS! Stored ${totalInDB} menu items (${withImages} with image URLs) in MongoDB Atlas!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB Seeding Error:", err.message);
    process.exit(1);
  }
}

seedDatabase();
