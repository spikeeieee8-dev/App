import { Router } from "express";
import { eq, and, ilike, or, inArray } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../lib/cache.js";

const router = Router();

const CACHE_TTL = 60;

function productsCacheKey(query: Record<string, unknown>): string {
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return parts ? `products:list:${parts}` : "products:list";
}

router.get("/", async (req, res) => {
  try {
    const { category, active, featured, search } = req.query;
    const cacheKey = productsCacheKey({ category, active, featured, search });

    const cached = await cacheGet<{ products: unknown[]; total: number }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const conditions = [];
    if (category) conditions.push(eq(schema.products.category, category as string));
    if (active !== undefined) conditions.push(eq(schema.products.isActive, active === "true"));
    if (featured === "true") conditions.push(eq(schema.products.isFeatured, true));
    if (search) {
      const q = `%${search}%`;
      conditions.push(
        or(
          ilike(schema.products.name, q),
          ilike(schema.products.description, q),
          ilike(schema.products.subcategory, q)
        )
      );
    }

    const rows = await db
      .select()
      .from(schema.products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const productIds = rows.map((p) => p.id);
    const variants =
      productIds.length > 0
        ? await db
            .select()
            .from(schema.productVariants)
            .where(inArray(schema.productVariants.productId, productIds))
        : [];

    const variantsByProduct = variants.reduce<Record<string, typeof schema.productVariants.$inferSelect[]>>(
      (acc, v) => {
        if (!acc[v.productId]) acc[v.productId] = [];
        acc[v.productId].push(v);
        return acc;
      },
      {}
    );

    const products = rows.map((p) => ({
      ...p,
      variants: variantsByProduct[p.id] ?? [],
    }));

    const result = { products, total: products.length };
    await cacheSet(cacheKey, result, CACHE_TTL);

    res.json(result);
  } catch (err) {
    console.error("List products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const cacheKey = `products:item:${req.params.id}`;
    const cached = await cacheGet<{ product: unknown }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const [product] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, req.params.id))
      .limit(1);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const variants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, product.id));

    const result = { product: { ...product, variants } };
    await cacheSet(cacheKey, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      name, description, category, subcategory,
      originalPrice, discountedPrice, costPrice,
      variants, tags, images, isNew, isFeatured, urgencyText,
    } = req.body;

    if (!name || !category || !originalPrice || !discountedPrice || !costPrice) {
      res.status(400).json({ error: "Required fields missing" });
      return;
    }

    const [product] = await db
      .insert(schema.products)
      .values({
        name: name.trim(),
        description: description || "",
        category,
        subcategory: subcategory || "",
        originalPrice: Number(originalPrice),
        discountedPrice: Number(discountedPrice),
        costPrice: Number(costPrice),
        images: images || [],
        tags: tags || [],
        isNew: !!isNew,
        isFeatured: !!isFeatured,
        urgencyText: urgencyText || null,
        isActive: true,
      })
      .returning();

    let savedVariants: typeof schema.productVariants.$inferSelect[] = [];
    if (variants?.length > 0) {
      savedVariants = await db
        .insert(schema.productVariants)
        .values(
          variants.map((v: { size: string; color: string; stock: number }) => ({
            productId: product.id,
            size: v.size,
            color: v.color,
            stock: Number(v.stock) || 0,
            reservedStock: 0,
          }))
        )
        .returning();
    }

    await cacheDelPattern("products:list*");

    res.status(201).json({ product: { ...product, variants: savedVariants } });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { variants, ...fields } = req.body;
    const {
      name, description, category, subcategory,
      originalPrice, discountedPrice, costPrice,
      images, tags, isNew, isFeatured, urgencyText, isActive,
    } = fields;

    const updateData: Partial<typeof schema.products.$inferInsert> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
    if (discountedPrice !== undefined) updateData.discountedPrice = Number(discountedPrice);
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (images !== undefined) updateData.images = images;
    if (tags !== undefined) updateData.tags = tags;
    if (isNew !== undefined) updateData.isNew = !!isNew;
    if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured;
    if (urgencyText !== undefined) updateData.urgencyText = urgencyText;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const [product] = await db
      .update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, req.params.id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (variants !== undefined && Array.isArray(variants)) {
      await db
        .delete(schema.productVariants)
        .where(eq(schema.productVariants.productId, product.id));

      if (variants.length > 0) {
        await db.insert(schema.productVariants).values(
          variants.map((v: { size: string; color: string; stock: number }) => ({
            productId: product.id,
            size: v.size,
            color: v.color,
            stock: Number(v.stock) || 0,
            reservedStock: 0,
          }))
        );
      }
    }

    const updatedVariants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, product.id));

    await cacheDelPattern("products:list*");
    await cacheDel(`products:item:${product.id}`);

    res.json({ product: { ...product, variants: updatedVariants } });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [product] = await db
      .update(schema.products)
      .set({ isActive: false })
      .where(eq(schema.products.id, req.params.id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    await cacheDelPattern("products:list*");
    await cacheDel(`products:item:${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
