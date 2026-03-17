import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToR2, isR2Configured } from "../lib/r2.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

const router = Router();

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed"));
    }
  },
});

router.post("/proof", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    const domain = process.env.REPLIT_DEV_DOMAIN || `localhost:${process.env.PORT || 3000}`;
    const url = `https://${domain}/api/uploads/${filename}`;
    res.json({ url, size: req.file.size, mimetype: req.file.mimetype });
  } catch (err) {
    console.error("Proof upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    if (isR2Configured()) {
      const folder = (req.query.folder as string) || "products";
      const url = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
      );
      res.json({ url, size: req.file.size, mimetype: req.file.mimetype });
      return;
    }

    const ext = path.extname(req.file.originalname) || (req.file.mimetype.startsWith("video/") ? ".mp4" : ".jpg");
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const domain = process.env.REPLIT_DEV_DOMAIN || `localhost:${process.env.PORT || 3000}`;
    const url = `https://${domain}/api/uploads/${filename}`;
    res.json({ url, size: req.file.size, mimetype: req.file.mimetype });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
