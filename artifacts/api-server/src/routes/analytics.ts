import { Router } from "express";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { cacheGet, cacheSet } from "../lib/cache.js";

const router = Router();

const ANALYTICS_CACHE_KEY = "analytics:dashboard";
const ANALYTICS_CACHE_TTL = 60;

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const cached = await cacheGet<object>(ANALYTICS_CACHE_KEY);
    if (cached) {
      res.json(cached);
      return;
    }

    const [revenueRow] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)`,
        totalShipping: sql<number>`COALESCE(SUM(${schema.orders.shippingCost}), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(schema.orders)
      .where(eq(schema.orders.status, "delivered"));

    const [costRow] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${schema.orderItems.quantity} * ${schema.products.costPrice}), 0)`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(eq(schema.orders.status, "delivered"));

    const totalRevenue = Number(revenueRow?.totalRevenue ?? 0);
    const totalShipping = Number(revenueRow?.totalShipping ?? 0);
    const totalCost = Number(costRow?.totalCost ?? 0);
    const totalProfit = totalRevenue - totalShipping - totalCost;

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

    const topProductsRaw = await db
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

    const topProducts = topProductsRaw.map((p) => ({
      id: p.productId,
      name: p.productName,
      unitsSold: Number(p.totalSold ?? 0),
      revenue: Number(p.totalRevenue ?? 0),
    }));

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

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayData = dailyRevenue.find((r) => r.date === dateStr);
      return {
        label: d.toLocaleDateString("en", { weekday: "short" }),
        revenue: Number(dayData?.revenue ?? 0),
        orders: Number(dayData?.orders ?? 0),
      };
    });

    const statusBreakdown = {
      pending: Number(pendingRow?.count ?? 0),
      awaiting_verification: Number(awaitingRow?.count ?? 0),
      verified: 0,
      dispatched: 0,
      delivered: Number(revenueRow?.totalOrders ?? 0),
      cancelled: 0,
    };

    const result = {
      totalRevenue,
      totalProfit,
      totalOrders: Number(allOrdersRow?.count ?? 0),
      totalProducts: 0,
      avgOrderValue: Number(allOrdersRow?.count ?? 0) > 0 ? Math.round(totalRevenue / Number(allOrdersRow?.count ?? 1)) : 0,
      deliveredOrders: Number(revenueRow?.totalOrders ?? 0),
      pendingOrders: Number(pendingRow?.count ?? 0),
      awaitingVerification: Number(awaitingRow?.count ?? 0),
      totalUsers: Number(userCountRow?.count ?? 0),
      last7Days,
      statusBreakdown,
      dailyRevenue,
      topProducts,
      recentOrders,
      lowStockAlerts: lowStockVariants,
      lowStockCount: lowStockVariants.length,
      pendingActions: Number(pendingRow?.count ?? 0) + Number(awaitingRow?.count ?? 0),
    };

    await cacheSet(ANALYTICS_CACHE_KEY, result, ANALYTICS_CACHE_TTL);
    res.json(result);
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
