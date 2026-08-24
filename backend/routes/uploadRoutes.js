import express from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dpvzrczch";
const API_KEY = process.env.CLOUDINARY_API_KEY || "364366925138271";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "zaivykT5-f3-l_cZlTk28izxXoM";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

/**
 * POST /api/upload & POST /upload
 * Accepts a base64 data URI from the dashboard, uploads to Cloudinary,
 * and returns the secure URL to store in MongoDB.
 */
router.post("/upload", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== "string" || !data.startsWith("data:")) {
      return res.status(400).json({ success: false, message: "No valid image data provided." });
    }

    // Upload directly from the base64 data URI to Cloudinary
    const result = await cloudinary.uploader.upload(data, {
      folder: "boost-coffee/items",
      resource_type: "image",
      transformation: [
        { width: 600, height: 600, crop: "limit", quality: "auto:good", fetch_format: "auto" },
      ],
    });

    console.log(`✅ Cloudinary upload success: ${result.secure_url}`);
    return res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ success: false, message: error.message || "Upload failed." });
  }
});

export default router;
