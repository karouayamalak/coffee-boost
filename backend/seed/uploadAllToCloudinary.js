import dns from "dns";
try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch(e){}

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpvzrczch",
  api_key: process.env.CLOUDINARY_API_KEY || "364366925138271",
  api_secret: process.env.CLOUDINARY_API_SECRET || "zaivykT5-f3-l_cZlTk28izxXoM",
});

async function run() {
  console.log("☁️ Testing Cloudinary connection and uploading items...");
  const itemsDir = path.resolve("public/items");
  
  if (!fs.existsSync(itemsDir)) {
    console.error("❌ public/items directory not found!");
    process.exit(1);
  }

  const files = fs.readdirSync(itemsDir).filter(f => f.endsWith(".png") || f.endsWith(".jpg"));
  console.log(`Found ${files.length} images to upload.`);

  const urlMap = {};

  for (const file of files) {
    const filePath = path.join(itemsDir, file);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "boost-coffee/items",
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });
      console.log(`✅ Uploaded ${file} -> ${result.secure_url}`);
      urlMap[`/items/${file}`] = result.secure_url;
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message);
    }
  }

  console.log("\n📦 Updating MongoDB menu items with new Cloudinary URLs...");
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB Atlas.");
      const items = await MenuItem.find();
      for (const item of items) {
        if (item.image && urlMap[item.image]) {
          item.image = urlMap[item.image];
          await item.save();
          console.log(`Updated DB: ${item.name} -> ${item.image}`);
        }
      }
      await mongoose.disconnect();
      console.log("🎉 All DB items updated with Cloudinary URLs!");
    } catch (err) {
      console.warn("⚠️ Mongo update warning:", err.message);
    }
  }

  console.log("Finished!");
  process.exit(0);
}

run();
