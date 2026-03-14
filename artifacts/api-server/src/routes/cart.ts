import { Router } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/reserve", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { variantId, quantity } = req.body;

    if (!variantId || !quantity || quantity <= 0) {
      res.status(400).json({ error: "variantId and a positive quantity are required" });
      return;
    }

    const [variant] = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, variantId))
      .limit(1);

    if (!variant) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    const availableStock = variant.stock - variant.reservedStock;
    if (availableStock < quantity) {
      res.status(409).json({
        error: "Not enough stock available",
        available: Math.max(0, availableStock),
      });
      return;
    }

    const [updated] = await db
      .update(schema.productVariants)
      .set({
        reservedStock: sql`LEAST(${schema.productVariants.stock}, ${schema.productVariants.reservedStock} + ${quantity})`,
      })
      .where(eq(schema.productVariants.id, variantId))
      .returning();

    res.json({ variant: updated });
  } catch (err) {
    console.error("Cart reserve error:", err);
    res.status(500).json({ error: "Failed to reserve stock" });
  }
});

router.delete("/release", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { variantId, quantity } = req.body;

    if (!variantId || !quantity || quantity <= 0) {
      res.status(400).json({ error: "variantId and a positive quantity are required" });
      return;
    }

    const [updated] = await db
      .update(schema.productVariants)
      .set({
        reservedStock: sql`GREATEST(0, ${schema.productVariants.reservedStock} - ${quantity})`,
      })
      .where(eq(schema.productVariants.id, variantId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    res.json({ variant: updated });
  } catch (err) {
    console.error("Cart release error:", err);
    res.status(500).json({ error: "Failed to release stock" });
  }
});

router.delete("/release-all", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { variantIds } = req.body as { variantIds: string[] };

    if (!variantIds?.length) {
      res.json({ success: true });
      return;
    }

    await db
      .update(schema.productVariants)
      .set({
        reservedStock: sql`GREATEST(0, ${schema.productVariants.reservedStock} - 1)`,
      })
      .where(inArray(schema.productVariants.id, variantIds));

    res.json({ success: true });
  } catch (err) {
    console.error("Cart release-all error:", err);
    res.status(500).json({ error: "Failed to release cart" });
  }
});

export default router;
