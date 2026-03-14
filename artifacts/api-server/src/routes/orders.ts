import { Router } from "express";
import { store, OrderStatus } from "../lib/store.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { status } = req.query;
  const filter: any = {};
  if (user.role !== "admin") filter.userId = user.id;
  if (status) filter.status = status as string;
  const orders = store.orders.list(filter);
  res.json({ orders, total: orders.length });
});

router.get("/:id", requireAuth, (req, res) => {
  const user = (req as any).user;
  const order = store.orders.findById(req.params.id);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (user.role !== "admin" && order.userId !== user.id) {
    res.status(403).json({ error: "Access denied" }); return;
  }
  res.json({ order });
});

router.post("/", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { items, subtotal, shippingCost, total, paymentMethod, paymentProofUri, address } = req.body;
  if (!items?.length || !address || !paymentMethod) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const order = store.orders.create({
    userId: user.id, items, subtotal, shippingCost, total,
    status: paymentMethod === "cod" ? "pending" : "awaiting_verification",
    paymentMethod, paymentProofUri, address,
  });
  res.status(201).json({ order });
});

router.put("/:id/status", requireAdmin, (req, res) => {
  const { status, courierTrackingId, courierName, notes } = req.body;
  const validStatuses: OrderStatus[] = ["pending", "awaiting_verification", "verified", "dispatched", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  const order = store.orders.updateStatus(req.params.id, status, { courierTrackingId, courierName, notes });
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({ order });
});

router.put("/:id", requireAdmin, (req, res) => {
  const order = store.orders.update(req.params.id, req.body);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({ order });
});

export default router;
