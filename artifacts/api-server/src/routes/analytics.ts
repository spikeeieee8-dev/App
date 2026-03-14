import { Router } from "express";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const [revenueRow] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)`,
        totalProfit: sql<number>`COALESCE(SUM(${schema.orders.total} - ${schema.orders.shippingCost}), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(schema.orders)
      .where(eq(schema.orders.status, "delivered"));

    const [allOrdersRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.orders);

    const [pendingRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.orders)
      .where(eq(schema.orders.status, "pending"));

    const [awaitingRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.orders)
      .where(eq(schema.orders.status, "awaiting_verification"));

    const [userCountRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.users);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${schema.orders.createdAt})::text`,
        revenue: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)`,
        orders: sql<number>`COUNT(*)`,
      })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${schema.orders.createdAt})`)
      .orderBy(sql`DATE(${schema.orders.createdAt})`);

    const topProducts = await db
      .select({
        productId: schema.orderItems.productId,
        productName: schema.orderItems.productName,
        totalSold: sql<number>`SUM(${schema.orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(${schema.orderItems.quantity} * ${schema.orderItems.price})`,
      })
      .from(schema.orderItems)
      .groupBy(schema.orderItems.productId, schema.orderItems.productName)
      .orderBy(desc(sql`SUM(${schema.orderItems.quantity})`))
      .limit(10);

    const recentOrders = await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(10);

    const lowStockVariants = await db
      .select({
        variantId: schema.productVariants.id,
        productId: schema.productVariants.productId,
        size: schema.productVariants.size,
        color: schema.productVariants.color,
        stock: schema.productVariants.stock,
        productName: schema.products.name,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(
        and(
          sql`${schema.productVariants.stock} <= 5`,
          eq(schema.products.isActive, true)
        )
      )
      .orderBy(schema.productVariants.stock)
      .limit(20);

    res.json({
      totalRevenue: Number(revenueRow?.totalRevenue ?? 0),
      totalProfit: Number(revenueRow?.totalProfit ?? 0),
      totalOrders: Number(allOrdersRow?.count ?? 0),
      deliveredOrders: Number(revenueRow?.totalOrders ?? 0),
      pendingOrders: Number(pendingRow?.count ?? 0),
      awaitingVerification: Number(awaitingRow?.count ?? 0),
      totalUsers: Number(userCountRow?.count ?? 0),
      dailyRevenue,
      topProducts,
      recentOrders,
      lowStockAlerts: lowStockVariants,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    }).from(schema.users);
    res.json({ users, total: users.length });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
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

router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== "user" && role !== "admin") {
      res.status(400).json({ error: "Role must be 'user' or 'admin'" });
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
    console.error("Change role error:", err);
    res.status(500).json({ error: "Failed to change role" });
  }
});

export default router;
