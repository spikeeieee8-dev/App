import { Router } from "express";
import { register } from "../lib/metrics.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(String(err));
  }
});

export default router;
