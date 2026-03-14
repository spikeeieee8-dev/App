import { Router } from "express";
import { store } from "../lib/store.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.delete("/:id", requireAdmin, (req, res) => {
  const user = store.users.findById(req.params.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  store.users.delete(req.params.id);
  res.json({ success: true });
});

router.patch("/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body;
  if (role !== "user" && role !== "admin") {
    res.status(400).json({ error: "Role must be user or admin" }); return;
  }
  const user = store.users.update(req.params.id, { role });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

export default router;
