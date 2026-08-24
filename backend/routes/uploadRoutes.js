import express from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// Configure Cloudinary with env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload
 * Accepts a base64 data URI from the dashboard, uploads to Cloudinary,
 * and returns the secure URL to store in MongoDB.
 *
 * Body: { data: "data:image/png;base64,..." }
 */
router.post("/upload", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.startsWith("data:")) {
      return res.status(400).json({ success: false, message: "No valid image data provided." });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured on this server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.",
      });
    }

    // Upload directly from the base64 data URI
    const result = await cloudinary.uploader.upload(data, {
      folder: "boost-coffee/items",
      resource_type: "image",
      transformation: [
        { width: 600, height: 600, crop: "limit", quality: "auto:good", fetch_format: "auto" },
      ],
    });

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
