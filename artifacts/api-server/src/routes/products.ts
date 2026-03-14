import { Router } from "express";
import { store } from "../lib/store.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", (req, res) => {
  const { category, active } = req.query;
  const filter: any = {};
  if (category) filter.category = category;
  if (active !== undefined) filter.isActive = active === "true";
  const products = store.products.list(filter);
  res.json({ products, total: products.length });
});

router.get("/:id", (req, res) => {
  const product = store.products.findById(req.params.id);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ product });
});

router.post("/", requireAdmin, (req, res) => {
  const { name, description, category, subcategory, originalPrice, discountedPrice, costPrice, variants, tags, isNew, isFeatured } = req.body;
  if (!name || !category || !originalPrice || !discountedPrice || !costPrice) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }
  const product = store.products.create({
    name, description: description || "", category, subcategory: subcategory || "",
    originalPrice: Number(originalPrice), discountedPrice: Number(discountedPrice),
    costPrice: Number(costPrice), images: [], variants: variants || [],
    tags: tags || [], isNew, isFeatured, isActive: true,
  });
  res.status(201).json({ product });
});

router.put("/:id", requireAdmin, (req, res) => {
  const product = store.products.update(req.params.id, req.body);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ product });
});

router.delete("/:id", requireAdmin, (req, res) => {
  const product = store.products.update(req.params.id, { isActive: false });
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ success: true });
});

export default router;
