import { Router } from "express";
import multer from "multer";
import { uploadToR2, isR2Configured } from "../lib/r2.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!isR2Configured()) {
      res.status(503).json({
        error: "Image storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const folder = (req.query.folder as string) || "products";
    const url = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.json({ url, size: req.file.size, mimetype: req.file.mimetype });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
