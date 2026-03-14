import crypto from "crypto";

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
};

export type ProductVariant = {
  size: string;
  color: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: "men" | "women";
  subcategory: string;
  originalPrice: number;
  discountedPrice: number;
  costPrice: number;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  urgencyText?: string;
  viewingCount?: number;
  isActive: boolean;
  createdAt: string;
};

export type OrderStatus =
  | "pending"
  | "awaiting_verification"
  | "verified"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type CartItem = {
  productId: string;
  productName: string;
  productPrice: number;
  size: string;
  color: string;
  quantity: number;
};

export type Order = {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "easypaid" | "jazzcash" | "cod";
  paymentProofUri?: string;
  address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
  };
  courierTrackingId?: string;
  courierName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  token: string;
  userId: string;
  expiresAt: string;
};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "almera_salt_2025").digest("hex");
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const users: Map<string, User> = new Map();
const products: Map<string, Product> = new Map();
const orders: Map<string, Order> = new Map();
const sessions: Map<string, Session> = new Map();

const seedProducts: Omit<Product, "createdAt">[] = [
  {
    id: "p001", name: "Premium Merino Polo", description: "Crafted from finest Merino wool, this polo embodies understated luxury.", category: "men", subcategory: "Polos", originalPrice: 8500, discountedPrice: 5999, costPrice: 3200, images: [], variants: [{ size: "S", color: "Midnight Black", stock: 8 }, { size: "M", color: "Midnight Black", stock: 12 }, { size: "L", color: "Midnight Black", stock: 3 }, { size: "XL", color: "Midnight Black", stock: 5 }, { size: "S", color: "Ivory White", stock: 6 }, { size: "M", color: "Ivory White", stock: 10 }], tags: ["polo", "formal", "merino"], isNew: true, isFeatured: true, urgencyText: "Only 3 left in black", viewingCount: 12, isActive: true,
  },
  {
    id: "p002", name: "Signature Oversized Tee", description: "The ultimate relaxed silhouette. 100% Egyptian cotton, garment-washed.", category: "men", subcategory: "Tees", originalPrice: 4500, discountedPrice: 2999, costPrice: 1400, images: [], variants: [{ size: "S", color: "Sand", stock: 15 }, { size: "M", color: "Sand", stock: 20 }, { size: "L", color: "Sand", stock: 8 }, { size: "XL", color: "Charcoal", stock: 10 }, { size: "XXL", color: "Charcoal", stock: 4 }], tags: ["tee", "casual", "oversized"], isFeatured: true, viewingCount: 28, isActive: true,
  },
  {
    id: "p003", name: "Luxe Hoodie", description: "French terry cotton blend with brushed interior. Heavyweight comfort.", category: "men", subcategory: "Hoodies/Sweatshirts", originalPrice: 12000, discountedPrice: 8500, costPrice: 4800, images: [], variants: [{ size: "S", color: "Slate Gray", stock: 5 }, { size: "M", color: "Slate Gray", stock: 9 }, { size: "L", color: "Slate Gray", stock: 7 }, { size: "M", color: "Jet Black", stock: 11 }, { size: "L", color: "Jet Black", stock: 6 }, { size: "XL", color: "Jet Black", stock: 3 }], tags: ["hoodie", "casual", "luxury"], isNew: true, urgencyText: "15 people viewing now", viewingCount: 15, isActive: true,
  },
  {
    id: "p004", name: "Satin Wrap Midi Dress", description: "Fluid satin wrap design that gracefully follows the body.", category: "women", subcategory: "Clothing", originalPrice: 14500, discountedPrice: 9999, costPrice: 5200, images: [], variants: [{ size: "S", color: "Blush Rose", stock: 4 }, { size: "M", color: "Blush Rose", stock: 7 }, { size: "L", color: "Blush Rose", stock: 3 }, { size: "S", color: "Deep Burgundy", stock: 5 }, { size: "M", color: "Deep Burgundy", stock: 6 }], tags: ["dress", "formal", "satin"], isFeatured: true, urgencyText: "Only 4 left in Blush Rose", viewingCount: 22, isActive: true,
  },
  {
    id: "p005", name: "Heritage Leather Belt", description: "Full-grain leather belt with brushed gold buckle.", category: "men", subcategory: "Accessories", originalPrice: 5500, discountedPrice: 3800, costPrice: 1900, images: [], variants: [{ size: "S", color: "Cognac Brown", stock: 10 }, { size: "M", color: "Cognac Brown", stock: 15 }, { size: "L", color: "Cognac Brown", stock: 8 }, { size: "M", color: "Jet Black", stock: 12 }], tags: ["belt", "accessories", "leather"], isActive: true,
  },
  {
    id: "p006", name: "Cashmere Blend Scarf", description: "Ultra-soft cashmere blend in versatile neutral tones.", category: "women", subcategory: "Accessories", originalPrice: 8000, discountedPrice: 5500, costPrice: 2800, images: [], variants: [{ size: "One Size", color: "Camel", stock: 8 }, { size: "One Size", color: "Ivory", stock: 6 }, { size: "One Size", color: "Charcoal", stock: 9 }], tags: ["scarf", "accessories", "cashmere"], isNew: true, isActive: true,
  },
  {
    id: "p007", name: "Slim Fit Formal Shirt", description: "Poplin cotton with precise tailoring. The boardroom staple reinvented.", category: "men", subcategory: "Clothing", originalPrice: 6500, discountedPrice: 4499, costPrice: 2200, images: [], variants: [{ size: "S", color: "Crisp White", stock: 20 }, { size: "M", color: "Crisp White", stock: 18 }, { size: "L", color: "Crisp White", stock: 12 }, { size: "XL", color: "Crisp White", stock: 8 }, { size: "M", color: "Powder Blue", stock: 10 }, { size: "L", color: "Powder Blue", stock: 7 }], tags: ["shirt", "formal", "cotton"], isFeatured: true, isActive: true,
  },
  {
    id: "p008", name: "Silk Blouse", description: "Pure mulberry silk with a delicate drape. A wardrobe essential.", category: "women", subcategory: "Clothing", originalPrice: 11000, discountedPrice: 7500, costPrice: 3800, images: [], variants: [{ size: "XS", color: "Pearl White", stock: 5 }, { size: "S", color: "Pearl White", stock: 8 }, { size: "M", color: "Pearl White", stock: 10 }, { size: "S", color: "Champagne Gold", stock: 4 }, { size: "M", color: "Champagne Gold", stock: 6 }], tags: ["blouse", "silk", "formal"], isNew: true, isFeatured: true, urgencyText: "7 people viewing now", viewingCount: 7, isActive: true,
  },
];

function seed() {
  const adminId = generateId("USR");
  users.set(adminId, {
    id: adminId, name: "Admin", email: "admin@almera.pk",
    passwordHash: hashPassword("admin123"), role: "admin",
    createdAt: new Date().toISOString(),
  });

  const userId = generateId("USR");
  users.set(userId, {
    id: userId, name: "Ali Khan", email: "ali@example.com",
    passwordHash: hashPassword("user123"), role: "user",
    phone: "03001234567", createdAt: new Date().toISOString(),
  });

  for (const p of seedProducts) {
    products.set(p.id, { ...p, createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() });
  }

  const statuses: OrderStatus[] = ["delivered", "delivered", "dispatched", "awaiting_verification", "pending"];
  const methods: Order["paymentMethod"][] = ["cod", "easypaid", "jazzcash", "cod", "easypaid"];
  for (let i = 0; i < 5; i++) {
    const id = `ORD-${1000 + i}`;
    const p = seedProducts[i % seedProducts.length];
    orders.set(id, {
      id, userId,
      items: [{ productId: p.id, productName: p.name, productPrice: p.discountedPrice, size: "M", color: "Black", quantity: i % 3 + 1 }],
      subtotal: p.discountedPrice * (i % 3 + 1),
      shippingCost: p.discountedPrice * (i % 3 + 1) >= 5000 ? 0 : 250,
      total: p.discountedPrice * (i % 3 + 1) + (p.discountedPrice * (i % 3 + 1) >= 5000 ? 0 : 250),
      status: statuses[i], paymentMethod: methods[i],
      address: { name: "Ali Khan", phone: "03001234567", address: `House ${i + 1}, Gulberg`, city: "Lahore", province: "Punjab" },
      createdAt: new Date(Date.now() - (i + 1) * 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
}

seed();

export const store = {
  hashPassword,
  generateId,

  users: {
    findByEmail: (email: string) => [...users.values()].find(u => u.email === email),
    findById: (id: string) => users.get(id),
    create: (data: Omit<User, "id" | "createdAt">) => {
      const user: User = { ...data, id: generateId("USR"), createdAt: new Date().toISOString() };
      users.set(user.id, user);
      return user;
    },
    update: (id: string, data: Partial<User>) => {
      const u = users.get(id);
      if (!u) return null;
      const updated = { ...u, ...data };
      users.set(id, updated);
      return updated;
    },
    list: () => [...users.values()],
    delete: (id: string) => users.delete(id),
    count: () => users.size,
  },

  products: {
    list: (filter?: { category?: string; isActive?: boolean }) =>
      [...products.values()].filter(p => {
        if (filter?.category && p.category !== filter.category) return false;
        if (filter?.isActive !== undefined && p.isActive !== filter.isActive) return false;
        return true;
      }),
    findById: (id: string) => products.get(id),
    create: (data: Omit<Product, "id" | "createdAt">) => {
      const product: Product = { ...data, id: generateId("PRD"), createdAt: new Date().toISOString() };
      products.set(product.id, product);
      return product;
    },
    update: (id: string, data: Partial<Product>) => {
      const p = products.get(id);
      if (!p) return null;
      const updated = { ...p, ...data };
      products.set(id, updated);
      return updated;
    },
    delete: (id: string) => products.delete(id),
    count: () => products.size,
  },

  orders: {
    list: (filter?: { userId?: string; status?: string }) =>
      [...orders.values()]
        .filter(o => {
          if (filter?.userId && o.userId !== filter.userId) return false;
          if (filter?.status && o.status !== filter.status) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    findById: (id: string) => orders.get(id),
    create: (data: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
      const order: Order = { ...data, id: generateId("ORD"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      orders.set(order.id, order);
      return order;
    },
    updateStatus: (id: string, status: OrderStatus, extra?: { courierTrackingId?: string; courierName?: string; notes?: string }) => {
      const o = orders.get(id);
      if (!o) return null;
      const updated = { ...o, status, ...extra, updatedAt: new Date().toISOString() };
      orders.set(id, updated);
      return updated;
    },
    update: (id: string, data: Partial<Order>) => {
      const o = orders.get(id);
      if (!o) return null;
      const updated = { ...o, ...data, updatedAt: new Date().toISOString() };
      orders.set(id, updated);
      return updated;
    },
    count: () => orders.size,
  },

  sessions: {
    create: (userId: string) => {
      const token = crypto.randomBytes(32).toString("hex");
      const session: Session = { token, userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
      sessions.set(token, session);
      return session;
    },
    find: (token: string) => sessions.get(token),
    delete: (token: string) => sessions.delete(token),
  },

  analytics: {
    summary: () => {
      const allOrders = [...orders.values()];
      const allProducts = [...products.values()];
      const now = new Date();

      const totalRevenue = allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
      const totalProfit = allOrders.filter(o => ["verified", "dispatched", "delivered"].includes(o.status)).reduce((s, o) => {
        return s + o.items.reduce((ps, item) => {
          const p = products.get(item.productId);
          return ps + (p ? (item.productPrice - p.costPrice) * item.quantity : 0);
        }, 0);
      }, 0);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const dayOrders = allOrders.filter(o => o.createdAt.slice(0, 10) === dateStr);
        return {
          date: dateStr,
          label: d.toLocaleDateString("en", { weekday: "short" }),
          revenue: dayOrders.reduce((s, o) => s + o.total, 0),
          orders: dayOrders.length,
        };
      });

      const statusBreakdown = {
        pending: allOrders.filter(o => o.status === "pending").length,
        awaiting_verification: allOrders.filter(o => o.status === "awaiting_verification").length,
        verified: allOrders.filter(o => o.status === "verified").length,
        dispatched: allOrders.filter(o => o.status === "dispatched").length,
        delivered: allOrders.filter(o => o.status === "delivered").length,
        cancelled: allOrders.filter(o => o.status === "cancelled").length,
      };

      const topProducts = allProducts
        .map(p => ({
          id: p.id, name: p.name,
          unitsSold: allOrders.flatMap(o => o.items).filter(i => i.productId === p.id).reduce((s, i) => s + i.quantity, 0),
          revenue: allOrders.flatMap(o => o.items).filter(i => i.productId === p.id).reduce((s, i) => s + i.productPrice * i.quantity, 0),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const lowStockProducts = allProducts.filter(p => p.isActive && p.variants.some(v => v.stock <= 5));

      return {
        totalRevenue, totalProfit,
        totalOrders: allOrders.length,
        totalProducts: allProducts.filter(p => p.isActive).length,
        totalUsers: users.size,
        avgOrderValue: allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length) : 0,
        last7Days,
        statusBreakdown,
        topProducts,
        lowStockCount: lowStockProducts.length,
        pendingActions: allOrders.filter(o => ["pending", "awaiting_verification"].includes(o.status)).length,
      };
    },
  },
};
