import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: varchar("phone", { length: 20 }),
    role: varchar("role", { length: 10 }).notNull().default("user"),
    googleId: text("google_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull().default(""),
    category: varchar("category", { length: 50 }).notNull(),
    subcategory: varchar("subcategory", { length: 100 }).notNull().default(""),
    originalPrice: integer("original_price").notNull(),
    discountedPrice: integer("discounted_price").notNull(),
    costPrice: integer("cost_price").notNull(),
    images: text("images").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    isNew: boolean("is_new").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    urgencyText: varchar("urgency_text", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.category),
    index("products_is_active_idx").on(t.isActive),
    index("products_is_featured_idx").on(t.isFeatured),
  ]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: varchar("size", { length: 20 }).notNull(),
    color: varchar("color", { length: 100 }).notNull(),
    stock: integer("stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
  },
  (t) => [
    index("variants_product_id_idx").on(t.productId),
    index("variants_product_size_color_idx").on(t.productId, t.size, t.color),
  ]
);

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    subtotal: integer("subtotal").notNull(),
    shippingCost: integer("shipping_cost").notNull().default(0),
    total: integer("total").notNull(),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
    paymentProofUri: text("payment_proof_uri"),
    addressName: varchar("address_name", { length: 255 }).notNull(),
    addressPhone: varchar("address_phone", { length: 20 }).notNull(),
    addressLine: text("address_line").notNull(),
    addressCity: varchar("address_city", { length: 100 }).notNull(),
    addressProvince: varchar("address_province", { length: 100 }).notNull(),
    courierTrackingId: varchar("courier_tracking_id", { length: 100 }),
    courierName: varchar("courier_name", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_at_idx").on(t.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    productName: varchar("product_name", { length: 255 }).notNull(),
    size: varchar("size", { length: 20 }).notNull(),
    color: varchar("color", { length: 100 }).notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)]
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    userId: uuid("user_id").references(() => users.id),
    productId: uuid("product_id").references(() => products.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("analytics_event_type_idx").on(t.eventType),
    index("analytics_created_at_idx").on(t.createdAt),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
  analyticsEvents: many(analyticsEvents),
}));

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type Setting = typeof settings.$inferSelect;