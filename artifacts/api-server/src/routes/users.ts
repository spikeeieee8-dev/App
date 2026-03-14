import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [deleted] = await db
      .delete(schema.users)
      .where(eq(schema.users.id, req.params.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.patch("/:id/role", requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== "user" && role !== "admin") {
      res.status(400).json({ error: "Role must be user or admin" });
      return;
    }
    const [user] = await db
      .update(schema.users)
      .set({ role })
      .where(eq(schema.users.id, req.params.id))
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;
