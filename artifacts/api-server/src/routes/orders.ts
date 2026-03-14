import { Router } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import { enqueueOrderConfirmation } from "../lib/queue.js";
import { orderCounter, revenueCounter } from "../lib/metrics.js";

const router = Router();

const VALID_STATUSES = [
  "pending",
  "awaiting_verification",
  "verified",
  "dispatched",
  "delivered",
  "cancelled",
] as const;

function formatOrder(order: typeof schema.orders.$inferSelect, items: typeof schema.orderItems.$inferSelect[]) {
  return {
    ...order,
    address: {
      name: order.addressName,
      phone: order.addressPhone,
      address: order.addressLine,
      city: order.addressCity,
      province: order.addressProvince,
    },
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, role } = req.jwtPayload!;
    const { status } = req.query;

    const conditions = [];
    if (role !== "admin") conditions.push(eq(schema.orders.userId, userId));
    if (status) conditions.push(eq(schema.orders.status, status as string));

    const rows = await db
      .select()
      .from(schema.orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.orders.createdAt));

    const orderIds = rows.map((o) => o.id);
    const allItems =
      orderIds.length > 0
        ? await db
            .select()
            .from(schema.orderItems)
            .where(inArray(schema.orderItems.orderId, orderIds))
        : [];

    const itemsByOrderAll = allItems.reduce<Record<string, typeof schema.orderItems.$inferSelect[]>>(
      (acc, item) => {
        if (!acc[item.orderId]) acc[item.orderId] = [];
        acc[item.orderId].push(item);
        return acc;
      },
      {}
    );

    const orders = rows.map((o) => formatOrder(o, itemsByOrderAll[o.id] ?? []));
    res.json({ orders, total: orders.length });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, role } = req.jwtPayload!;
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, req.params.id))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (role !== "admin" && order.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    res.json({ order: formatOrder(order, items) });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, email } = req.jwtPayload!;
    const { items, subtotal, shippingCost, total, paymentMethod, paymentProofUri, address } = req.body;

    if (!items?.length || !address || !paymentMethod) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const status = paymentMethod === "cod" ? "pending" : "awaiting_verification";

    const [order] = await db
      .insert(schema.orders)
      .values({
        userId,
        subtotal: Number(subtotal),
        shippingCost: Number(shippingCost) || 0,
        total: Number(total),
        status,
        paymentMethod,
        paymentProofUri: paymentProofUri || null,
        addressName: address.name,
        addressPhone: address.phone,
        addressLine: address.address,
        addressCity: address.city,
        addressProvince: address.province,
      })
      .returning();

    const orderItemRows = items.map((item: {
      productId?: string;
      variantId?: string;
      productName: string;
      size: string;
      color: string;
      quantity: number;
      price?: number;
      productPrice?: number;
    }) => ({
      orderId: order.id,
      productId: item.productId || null,
      variantId: item.variantId || null,
      productName: item.productName,
      size: item.size,
      color: item.color,
      quantity: Number(item.quantity),
      price: Number(item.price ?? item.productPrice ?? 0),
    }));

    await db.insert(schema.orderItems).values(orderItemRows);

    for (const item of orderItemRows) {
      if (item.productId && item.size && item.color) {
        await db
          .update(schema.productVariants)
          .set({
            stock: sql`GREATEST(0, ${schema.productVariants.stock} - ${item.quantity})`,
            reservedStock: sql`GREATEST(0, ${schema.productVariants.reservedStock} - ${item.quantity})`,
          })
          .where(
            and(
              eq(schema.productVariants.productId, item.productId),
              eq(schema.productVariants.size, item.size),
              eq(schema.productVariants.color, item.color)
            )
          );
      }
    }

    orderCounter.inc({ payment_method: paymentMethod });
    revenueCounter.inc(Number(total));

    await enqueueOrderConfirmation(order.id, email);

    const savedItems = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    res.status(201).json({ order: formatOrder(order, savedItems) });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, courierTrackingId, courierName, notes } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [order] = await db
      .update(schema.orders)
      .set({
        status,
        courierTrackingId: courierTrackingId || null,
        courierName: courierName || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, req.params.id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    res.json({ order: formatOrder(order, items) });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { status, courierTrackingId, courierName, notes, paymentProofUri } = req.body;
    const update: Partial<typeof schema.orders.$inferInsert> = { updatedAt: new Date() };
    if (status && VALID_STATUSES.includes(status)) update.status = status;
    if (courierTrackingId !== undefined) update.courierTrackingId = courierTrackingId;
    if (courierName !== undefined) update.courierName = courierName;
    if (notes !== undefined) update.notes = notes;
    if (paymentProofUri !== undefined) update.paymentProofUri = paymentProofUri;

    const [order] = await db
      .update(schema.orders)
      .set(update)
      .where(eq(schema.orders.id, req.params.id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    res.json({ order: formatOrder(order, items) });
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
