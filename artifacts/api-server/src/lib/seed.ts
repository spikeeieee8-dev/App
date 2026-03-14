import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const { Pool } = pg;

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Seeding database...");

  const adminEmail = "admin@almera.pk";
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await db.insert(schema.users).values({
      name: "Almera Admin",
      email: adminEmail,
      passwordHash,
      phone: "03001234567",
      role: "admin",
    });
    console.log("✓ Admin user created: admin@almera.pk / admin123");
  } else {
    console.log("✓ Admin user already exists");
  }

  const productCount = await db.select().from(schema.products).limit(1);
  if (productCount.length === 0) {
    const [product1] = await db
      .insert(schema.products)
      .values({
        name: "Premium Merino Polo",
        description:
          "Crafted from finest Merino wool, this polo embodies understated luxury. Perfect for formal and casual occasions.",
        category: "men",
        subcategory: "Polos",
        originalPrice: 8500,
        discountedPrice: 5999,
        costPrice: 3200,
        images: [],
        tags: ["polo", "merino", "luxury"],
        isNew: true,
        isFeatured: true,
        isActive: true,
      })
      .returning();

    await db.insert(schema.productVariants).values([
      { productId: product1.id, size: "S", color: "Midnight Black", stock: 10, reservedStock: 0 },
      { productId: product1.id, size: "M", color: "Midnight Black", stock: 15, reservedStock: 0 },
      { productId: product1.id, size: "L", color: "Midnight Black", stock: 8, reservedStock: 0 },
      { productId: product1.id, size: "M", color: "Navy Blue", stock: 12, reservedStock: 0 },
      { productId: product1.id, size: "L", color: "Navy Blue", stock: 6, reservedStock: 0 },
    ]);

    const [product2] = await db
      .insert(schema.products)
      .values({
        name: "Silk Lawn Kurta",
        description:
          "Hand-crafted silk lawn kurta with intricate embroidery. A masterpiece of Pakistani craftsmanship.",
        category: "women",
        subcategory: "Kurtas",
        originalPrice: 12000,
        discountedPrice: 8999,
        costPrice: 5500,
        images: [],
        tags: ["kurta", "silk", "embroidery", "eid"],
        isNew: true,
        isFeatured: true,
        isActive: true,
      })
      .returning();

    await db.insert(schema.productVariants).values([
      { productId: product2.id, size: "XS", color: "Ivory White", stock: 5, reservedStock: 0 },
      { productId: product2.id, size: "S", color: "Ivory White", stock: 8, reservedStock: 0 },
      { productId: product2.id, size: "M", color: "Ivory White", stock: 10, reservedStock: 0 },
      { productId: product2.id, size: "S", color: "Blush Pink", stock: 7, reservedStock: 0 },
      { productId: product2.id, size: "M", color: "Blush Pink", stock: 9, reservedStock: 0 },
    ]);

    const [product3] = await db
      .insert(schema.products)
      .values({
        name: "Linen Shalwar Kameez",
        description:
          "Premium linen fabric with contemporary cut. Effortlessly elegant for the modern Pakistani man.",
        category: "men",
        subcategory: "Shalwar Kameez",
        originalPrice: 9500,
        discountedPrice: 6999,
        costPrice: 4000,
        images: [],
        tags: ["shalwar", "kameez", "linen", "summer"],
        isNew: false,
        isFeatured: true,
        isActive: true,
      })
      .returning();

    await db.insert(schema.productVariants).values([
      { productId: product3.id, size: "M", color: "Camel Beige", stock: 20, reservedStock: 0 },
      { productId: product3.id, size: "L", color: "Camel Beige", stock: 15, reservedStock: 0 },
      { productId: product3.id, size: "XL", color: "Camel Beige", stock: 10, reservedStock: 0 },
      { productId: product3.id, size: "M", color: "Olive Green", stock: 12, reservedStock: 0 },
      { productId: product3.id, size: "L", color: "Olive Green", stock: 8, reservedStock: 0 },
    ]);

    console.log("✓ 3 sample products created");
  } else {
    console.log("✓ Products already exist");
  }

  await pool.end();
  console.log("Seeding complete!");
}

seed().catch(console.error);
