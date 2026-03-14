import { Router } from "express";
import { store } from "../lib/store.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAdmin, (_req, res) => {
  const summary = store.analytics.summary();
  res.json(summary);
});

router.get("/users", requireAdmin, (_req, res) => {
  const users = store.users.list().map(({ passwordHash: _, ...u }) => u);
  res.json({ users, total: users.length });
});

export default router;
