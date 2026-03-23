# Almera — Architecture & Rebuild Guide

> A complete reference for recreating this exact e-commerce platform: same layout, structure, stack, and performance characteristics. Built for Pakistani fashion retail with mobile-first design.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [API Server Architecture](#5-api-server-architecture)
6. [Mobile App Architecture](#6-mobile-app-architecture)
7. [Screen-by-Screen Breakdown](#7-screen-by-screen-breakdown)
8. [State Management](#8-state-management)
9. [Authentication Flow](#9-authentication-flow)
10. [Payment Flow (Easypaisa + COD)](#10-payment-flow)
11. [File Storage (Cloudflare R2)](#11-file-storage-cloudflare-r2)
12. [Admin Panel](#12-admin-panel)
13. [Performance Optimizations](#13-performance-optimizations)
14. [Design System](#14-design-system)
15. [Environment Setup](#15-environment-setup)
16. [Deployment](#16-deployment)

---

## 1. Project Overview

Almera is a **mobile-first e-commerce platform** for Pakistani fashion retail. The app runs as an Expo React Native web app, served through a Replit proxy.

**Core flows:**
- Guest browsing → product discovery → cart → checkout (with address + payment)
- Easypaisa manual payment (upload screenshot proof) or Cash on Delivery
- Admin panel for order management, product CRUD, user management, and content editing

---

## 2. Monorepo Structure

```
workspace/
├── artifacts/
│   ├── mobile/          # Expo React Native app (main app, port 18115)
│   └── api-server/      # Express API server (port 8080)
├── lib/
│   ├── db/              # Drizzle ORM schema + migrations (shared)
│   └── api-zod/         # Zod schemas for API validation (shared)
├── pnpm-workspace.yaml
├── package.json
└── ARCHITECTURE.md
```

**Workspace package names:**
- `@workspace/mobile` — Expo app
- `@workspace/api-server` — Express API
- `@workspace/db` — Drizzle schema
- `@workspace/api-zod` — Zod validation schemas

**Package manager:** pnpm with workspace support
```yaml
# pnpm-workspace.yaml
packages:
  - "artifacts/*"
  - "lib/*"
```

---

## 3. Tech Stack

### Mobile App
| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Routing | Expo Router v6 (file-based, same as Next.js) |
| State | React Context API (AppContext + AuthContext) |
| HTTP | Fetch API with AsyncStorage token |
| Fonts | Inter (400, 500, 600, 700) via expo-google-fonts |
| Icons | @expo/vector-icons (Feather set) |
| Animations | react-native-reanimated + react-native-gesture-handler |
| Images | expo-image (better performance than Image) |
| Notifications | expo-notifications |
| Storage | @react-native-async-storage/async-storage |

### API Server
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript (tsx for dev) |
| Framework | Express.js |
| Database ORM | Drizzle ORM |
| Database | PostgreSQL (Replit built-in) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Upload | Multer → Cloudflare R2 (AWS SDK v3) |
| Rate Limiting | express-rate-limit |
| Security | helmet |
| Metrics | prom-client (Prometheus) |
| Validation | Zod |

### Infrastructure
| Service | Provider |
|---------|---------|
| Hosting | Replit (dev + production) |
| Database | Replit PostgreSQL |
| File Storage | Cloudflare R2 (S3-compatible) |
| CDN | Cloudflare (via R2 public URL) |

---

## 4. Database Schema

All schema is defined in `lib/db/src/schema/index.ts` using Drizzle ORM.

### Users Table
```typescript
users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 10 }).default("user"),   // "user" | "admin"
  googleId: varchar("google_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Products Table
```typescript
products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),    // "men" | "women"
  subcategory: varchar("subcategory", { length: 100 }),
  originalPrice: integer("original_price").notNull(),          // in PKR, stored as integer
  discountedPrice: integer("discounted_price").notNull(),
  costPrice: integer("cost_price").default(0),
  images: text("images").array().default([]),
  tags: text("tags").array().default([]),
  isNew: boolean("is_new").default(false),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  urgencyText: varchar("urgency_text", { length: 255 }),
  viewingCount: integer("viewing_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Product Variants Table
```typescript
productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  size: varchar("size", { length: 50 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  stock: integer("stock").notNull().default(0),
  reservedStock: integer("reserved_stock").default(0),
});
```

### Orders Table
```typescript
orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  subtotal: integer("subtotal").notNull(),
  shippingCost: integer("shipping_cost").notNull().default(0),
  total: integer("total").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  // Valid statuses: "pending" | "awaiting_verification" | "verified" | "dispatched" | "delivered" | "cancelled"
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  // Values: "easypaisa" | "cod"
  paymentProofUri: text("payment_proof_uri"),
  addressName: varchar("address_name", { length: 255 }).notNull(),
  addressPhone: varchar("address_phone", { length: 20 }).notNull(),
  addressLine: text("address_line").notNull(),
  addressCity: varchar("address_city", { length: 100 }).notNull(),
  addressProvince: varchar("address_province", { length: 100 }),
  courierTrackingId: varchar("courier_tracking_id", { length: 255 }),
  courierName: varchar("courier_name", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Order Items Table
```typescript
orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id),
  name: varchar("name", { length: 255 }).notNull(),
  size: varchar("size", { length: 50 }),
  color: varchar("color", { length: 100 }),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
});
```

### Settings Table (Key-Value Store)
```typescript
settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Public setting keys** (accessible without auth):
`easypaisa_number`, `easypaisa_name`, `easypaisa_qr_url`, `whatsapp_number`, `instagram_url`, `twitter_url`, `tiktok_url`, `store_name`, `store_tagline`, `terms_content`, `privacy_content`, `refund_content`, `about_content`

### Run Migrations
```bash
pnpm run --filter @workspace/db push
```

---

## 5. API Server Architecture

### File Structure
```
artifacts/api-server/src/
├── index.ts              # Entry point — listens on PORT + port 8080 (proxy bridge)
├── app.ts                # Express app setup (helmet, cors, rate limiting, routes)
├── lib/
│   ├── db.ts             # Drizzle db instance
│   ├── r2.ts             # Cloudflare R2 S3 client
│   ├── jwt.ts            # Sign/verify JWT tokens
│   ├── metrics.ts        # Prometheus counters
│   └── seed.ts           # Database seed utility
├── middlewares/
│   └── auth.ts           # requireAuth + requireAdmin middleware
└── routes/
    ├── index.ts          # Router aggregator
    ├── auth.ts           # POST /auth/register, /auth/login, GET /auth/me, etc.
    ├── products.ts       # GET /products, POST, PUT /:id, DELETE /:id
    ├── orders.ts         # GET /orders, POST, PUT /:id/status
    ├── analytics.ts      # GET /analytics, /analytics/users, POST/DELETE/PATCH users
    ├── settings.ts       # GET /settings/public, GET/PUT /settings/:key
    ├── upload.ts         # POST /upload (R2), POST /upload/proof
    ├── cart.ts           # POST /cart/reserve, DELETE /cart/release
    ├── health.ts         # GET /healthz
    └── metrics-route.ts  # GET /metrics (Prometheus)
```

### Authentication Middleware
```typescript
// All admin routes use:
router.get("/route", requireAdmin, handler);

// Protected user routes use:
router.get("/route", requireAuth, handler);

// JWT payload structure:
{ userId: string; role: "user" | "admin"; email: string; iat: number; exp: number }
```

### Port Strategy
The server listens on `PORT` env var AND also tries to bind port 8080 (the Replit proxy port for `/api` routes). This ensures the proxy routing works whether the artifact workflow or the legacy `Start Backend` workflow is used first.

```typescript
// index.ts pattern
server.listen(port);                     // Primary port from env
if (port !== 8080) {
  proxyServer.listen(8080);              // Also bind 8080 for proxy routing
  // Handles EADDRINUSE gracefully if already taken
}
```

### Key API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Login, get JWT |
| GET | `/api/auth/me` | User | Get current user |
| PATCH | `/api/auth/profile` | User | Update name/phone |
| PATCH | `/api/auth/password` | User | Change password |
| GET | `/api/products` | None | List products (filterable) |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product + variants |
| DELETE | `/api/products/:id` | Admin | Soft-delete product |
| GET | `/api/orders` | User | Get orders (admin gets all) |
| POST | `/api/orders` | User | Place order |
| PUT | `/api/orders/:id/status` | Admin | Update order status |
| GET | `/api/analytics` | Admin | Dashboard metrics |
| GET | `/api/analytics/users` | Admin | List all users |
| POST | `/api/analytics/users` | Admin | Create user |
| DELETE | `/api/analytics/users/:id` | Admin | Delete user |
| PATCH | `/api/analytics/users/:id/role` | Admin | Promote/demote user |
| GET | `/api/settings/public` | None | Public store settings |
| GET | `/api/settings` | Admin | All settings |
| PUT | `/api/settings/:key` | Admin | Update setting |
| POST | `/api/upload` | User | Upload file to R2 |
| GET | `/api/healthz` | None | Health check |

---

## 6. Mobile App Architecture

### File Structure
```
artifacts/mobile/
├── app/                           # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (fonts, splash, auth guard)
│   ├── index.tsx                 # Welcome/splash screen
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx          # Tab bar definition
│   │   ├── index.tsx            # Home screen
│   │   ├── shop.tsx             # Product listing
│   │   ├── cart.tsx             # Shopping cart
│   │   ├── orders.tsx           # Order history
│   │   ├── profile.tsx          # User profile + settings
│   │   └── more.tsx             # More / links / about
│   ├── auth/
│   │   ├── login.tsx            # Login screen
│   │   └── register.tsx (?)     # Register (may be in login)
│   ├── admin/
│   │   ├── index.tsx            # Admin dashboard
│   │   ├── orders.tsx           # Order management
│   │   ├── products.tsx         # Product management
│   │   ├── users.tsx            # User management
│   │   └── settings.tsx         # Store settings + content editing
│   ├── product/[id].tsx         # Product detail page
│   ├── order/[id].tsx           # Order detail page
│   ├── checkout.tsx             # Checkout flow
│   ├── order-success.tsx        # Post-order confirmation
│   ├── about.tsx                # About Almera page
│   ├── wishlist.tsx             # Saved products
│   ├── addresses.tsx            # Saved delivery addresses
│   ├── account/                 # Account management screens
│   └── legal/[slug].tsx         # Terms, Privacy, Refund pages
├── context/
│   ├── AppContext.tsx            # Cart, wishlist, orders, products, dark mode
│   └── AuthContext.tsx          # Auth state, login, register, logout
├── services/
│   ├── api.ts                   # All API calls (typed fetch wrapper)
│   └── notifications.ts         # Expo notifications helpers
└── constants/
    └── colors.ts                # Full design system colors
```

### Routing Convention (Expo Router)
Expo Router uses file-based routing identical to Next.js App Router:

```
app/index.tsx          → /
app/(tabs)/shop.tsx    → /shop (inside tab navigator)
app/product/[id].tsx   → /product/123 (dynamic segment)
app/legal/[slug].tsx   → /legal/terms
app/about.tsx          → /about
app/admin/index.tsx    → /admin
```

**Navigation:**
```typescript
import { router } from "expo-router";

router.push("/about");                    // Navigate forward
router.push({ pathname: "/legal/[slug]", params: { slug: "terms" } });
router.back();                            // Go back
router.replace("/");                      // Replace current screen
```

---

## 7. Screen-by-Screen Breakdown

### Home Screen `(tabs)/index.tsx`
- Hero banner with brand imagery
- Featured products horizontal scroll
- Category shortcuts (Men / Women)
- Dark mode toggle

### Shop Screen `(tabs)/shop.tsx`
- Full product grid with search + category filter
- Products loaded from AppContext (cached from API)
- Pull-to-refresh
- Each card: image, name, price with strike-through original if discounted

### Cart Screen `(tabs)/cart.tsx`
- List of cart items from AppContext
- Quantity adjustment (re-reserves stock via API)
- Empty state with "Shop Now" CTA
- Persistent across app sessions (saved to AsyncStorage)

### Checkout `app/checkout.tsx`
- Delivery address form (name, phone, address, city, province)
- Payment method selection: Easypaisa or Cash on Delivery
- Easypaisa flow: shows account number/QR code, requires payment proof upload
- Order creation → navigates to order-success

### Order Detail `app/order/[id].tsx`
- Status timeline (Pending → Verified → Dispatched → Delivered)
- Order items list
- Delivery address summary
- Payment method + proof image (if applicable)

### Admin Dashboard `app/admin/index.tsx`
- Real-time metrics: revenue, profit, orders, AOV, users, low stock alerts
- 7-day revenue + orders charts
- Order status breakdown
- Top products by revenue

### Admin Orders `app/admin/orders.tsx`
- Filterable order list by status
- Inline status update (dropdown per order)
- Add courier tracking info modal
- Payment proof viewer

### Admin Products `app/admin/products.tsx`
- Product list with stock levels
- Quick stock indicators (low stock warnings)
- Create/edit product modal with:
  - Multi-image upload to R2
  - Variant management (size × color × stock)
  - Pricing (cost, original, discounted)
  - Category, tags, featured flag

### Admin Users `app/admin/users.tsx`
- Searchable user list with filter tabs (All / Customers / Admins)
- Promote / Demote with in-app confirmation modal
- Delete user with confirmation
- Add User form modal (name, email, password, phone, role)

### Admin Settings `app/admin/settings.tsx`
- Easypaisa account details (number, name, QR code upload)
- Social links (WhatsApp, Instagram, Twitter, TikTok)
- Legal page content editor (Terms, Privacy, Refund) — Markdown
- About Almera content editor — Markdown
- Database connection URL management

---

## 8. State Management

### AppContext — Global Store
```typescript
// What it manages:
const appState = {
  products: Product[],          // All active products (fetched on mount)
  cart: CartItem[],             // Persisted to AsyncStorage
  wishlist: string[],           // Product IDs, persisted to AsyncStorage
  orders: Order[],              // Fetched when authenticated
  isDarkMode: boolean,          // Persisted to AsyncStorage
  hasSeenWelcome: boolean,      // Persisted to AsyncStorage

  // Actions:
  addToCart: (product, size, color) => void,
  removeFromCart: (product, size, color) => void,
  updateQuantity: (product, size, color, quantity) => void,
  clearCart: () => void,
  toggleWishlist: (productId) => void,
  placeOrder: (orderData) => Promise<Order>,
  refreshOrders: () => Promise<void>,
  refreshProducts: () => Promise<void>,
};
```

### AuthContext — Auth State
```typescript
const authState = {
  user: { id, name, email, role, phone, createdAt } | null,
  isAuthenticated: boolean,
  isLoading: boolean,

  login: (email, password) => Promise<void>,
  register: (name, email, password, phone?) => Promise<void>,
  logout: () => Promise<void>,
  updateProfile: (name, phone?) => Promise<void>,
  changePassword: (current, new) => Promise<void>,
};
```

### Data Persistence (AsyncStorage)
```typescript
const KEYS = {
  AUTH_TOKEN: "auth_token",
  AUTH_USER: "auth_user",
  CART: "almera_cart",
  WISHLIST: "almera_wishlist",
  DARK_MODE: "almera_dark_mode",
  HAS_SEEN_WELCOME: "almera_has_seen_welcome",
};
```

---

## 9. Authentication Flow

```
1. User opens app
   ↓
2. AuthContext.tsx reads AsyncStorage for "auth_token" + "auth_user"
   ↓
3. If token exists → call GET /api/auth/me to verify it's still valid
   ↓
4. If valid → set user state → app loads authenticated
   If invalid → clear storage → show as guest
   ↓
5. Login/Register → POST /api/auth/login or /register
   → Receive { user, token }
   → Store token in AsyncStorage
   → Set user state
```

**JWT Configuration:**
- Algorithm: HS256
- Expiry: 30 days
- Secret: `JWT_SECRET` env var (required)
- Payload: `{ userId, role, email }`

**Admin detection:**
```typescript
// In route guards, check user.role === "admin"
// Admin-only screens check before render:
if (user?.role !== "admin") router.replace("/");
```

---

## 10. Payment Flow

### Cash on Delivery (COD)
```
Checkout → select COD → place order
→ status: "pending"
→ Admin fulfils and updates status manually
```

### Easypaisa
```
Checkout → select Easypaisa
→ App shows: account number, account name, QR code (from admin settings)
→ User transfers money manually via Easypaisa app
→ User uploads screenshot as payment proof
→ POST /api/upload/proof → uploads to R2 → returns public URL
→ Place order with paymentProofUri
→ status: "awaiting_verification"
→ Admin views proof → marks as "verified"
```

**Payment method values in DB:** `"easypaisa"` or `"cod"` (stored as varchar)

---

## 11. File Storage (Cloudflare R2)

### Environment Variables Required
```bash
R2_ACCESS_KEY_ID=<from Cloudflare dashboard>
R2_SECRET_ACCESS_KEY=<from Cloudflare dashboard>
R2_ACCOUNT_ID=<your Cloudflare account ID>
R2_BUCKET_NAME=<your bucket name>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<your-custom-domain-or-r2-url>
```

### R2 Client Setup (`lib/r2.ts`)
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,            // Required for R2 compatibility
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

### Upload Flow
```
Mobile picks image (expo-image-picker)
→ POST /api/upload (multipart/form-data) with Bearer token
→ Multer receives file buffer
→ PutObjectCommand to R2
→ Returns { url: "https://r2.yourdomain.com/products/filename.jpg" }
```

**Folder organization in R2:**
- `products/` — product images
- `settings/` — QR codes, store assets
- `proofs/` — payment proof screenshots

---

## 12. Admin Panel

Admin panel is accessible at `/admin` and requires `role === "admin"`.

### Access Control
```typescript
// In admin/_layout.tsx or at top of each admin screen:
const { user } = useAuth();
useEffect(() => {
  if (user && user.role !== "admin") router.replace("/");
}, [user]);
```

### Admin Credentials (First-Time Setup)
1. Register normally via the app
2. Manually update role in DB:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
OR use the admin panel's Add User feature with role = Admin.

### Content Management via Settings API
The settings table acts as a mini-CMS:
```typescript
// Admin edits content
PUT /api/settings/about_content
body: { value: "# About Almera\n\n..." }

// App reads public content
GET /api/settings/public
→ { settings: { about_content: "...", store_tagline: "...", ... } }
```

---

## 13. Performance Optimizations

### Mobile App
1. **Image lazy loading** — `expo-image` with `contentFit="cover"` and `transition` for smooth loading
2. **Product caching** — Products fetched once on mount, cached in AppContext, refreshed on pull-to-refresh
3. **Cart persistence** — Stored in AsyncStorage to avoid re-fetching
4. **React Compiler enabled** — `babel-plugin-react-compiler` for automatic memoization
5. **CI=1 flag** — Metro bundler in CI mode (reloads disabled for performance in production)
6. **Font preloading** — All Inter font weights loaded in root `_layout.tsx` before app renders
7. **Splash screen** — `expo-splash-screen` held until fonts + auth check complete
8. **Minimize re-renders** — Context split (AppContext vs AuthContext) to prevent unnecessary re-renders

### API Server
1. **Rate limiting** — Global 100 req/15min, auth routes 20 req/15min
2. **Helmet** — Security headers including CSP
3. **Connection pooling** — Drizzle uses `pg` pool (default 10 connections)
4. **Soft deletes** — Products use `isActive: false` instead of hard delete for data integrity
5. **Stock reservation** — Cart reserves stock on add, releases on remove/order cancel, preventing overselling
6. **Prometheus metrics** — Track order counts, revenue, API performance at `/metrics`

### Database
1. **UUIDs** — Use `gen_random_uuid()` for distributed-safe IDs
2. **Indexed queries** — Orders filtered by userId, status; products filtered by category, isActive
3. **Cascade deletes** — Order items cascade from orders, variants from products

---

## 14. Design System

All design tokens are in `artifacts/mobile/constants/colors.ts`.

### Color Palette
```typescript
const Colors = {
  gold: "#C9A84C",              // Primary brand color
  charcoal: "#1C1C1E",          // Dark text / dark backgrounds
  offWhite: "#F5F0E8",          // Warm background
  errorRed: "#E74C3C",          // Errors, destructive actions
  successGreen: "#27AE60",      // Success states
  mutedGray: "#8E8E93",         // Subtle text

  light: {
    background: "#F5F0E8",      // Warm off-white
    card: "#FFFFFF",
    text: "#1C1C1E",
    textSecondary: "#6B6B70",
    border: "#E5DDD0",
    inputBg: "#FAFAFA",
    backgroundSecondary: "#F0EBE3",
  },

  dark: {
    background: "#0F0F0F",
    card: "#1C1C1E",
    text: "#F5F0E8",
    textSecondary: "#8E8E93",
    border: "#2C2C2E",
    inputBg: "#2C2C2E",
    backgroundSecondary: "#1C1C1E",
  },
};
```

### Typography
All text uses Inter font family. Load via:
```typescript
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
```

**Usage pattern:**
```typescript
// Headings
{ fontFamily: "Inter_700Bold", fontSize: 24 }

// Body
{ fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 }

// Labels / captions
{ fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.3 }

// Buttons
{ fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.charcoal }
```

### Layout Patterns

**Standard screen layout:**
```typescript
<View style={{ flex: 1, backgroundColor: theme.background }}>
  {/* Header — fixed, respects safe area */}
  <View style={{ paddingTop: insets.top + 8, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: theme.text }}>
      Title
    </Text>
  </View>

  {/* Scrollable content */}
  <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
    {/* Content */}
  </ScrollView>
</View>
```

**Card component pattern:**
```typescript
<View style={{
  backgroundColor: theme.card,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: theme.border,
  padding: 16,
}}>
```

**Gold action button:**
```typescript
<Pressable style={{
  backgroundColor: Colors.gold,
  borderRadius: 14,
  paddingVertical: 16,
  alignItems: "center",
}}>
  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.charcoal }}>
    Action
  </Text>
</Pressable>
```

---

## 15. Environment Setup

### Required Environment Variables

**API Server:**
```bash
PORT=8080                          # Server port (set by Replit artifact system)
DATABASE_URL=postgresql://...      # Replit PostgreSQL connection string
JWT_SECRET=your-secret-key        # Long random string for JWT signing
NODE_ENV=development               # or "production"

# Cloudflare R2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=...
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_PUBLIC_URL=https://r2.yourdomain.com
```

**Mobile App:**
```bash
EXPO_PUBLIC_DOMAIN=<replit-dev-domain>   # e.g. abc.replit.dev
EXPO_PUBLIC_REPL_ID=<replit-repl-id>
REPLIT_EXPO_DEV_DOMAIN=<expo-dev-domain>
```

### First-Time Setup
```bash
# Install dependencies
pnpm install

# Push database schema (creates all tables)
pnpm run --filter @workspace/db push

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start mobile app (port 18115)
pnpm --filter @workspace/mobile run dev
```

---

## 16. Deployment

### Replit Deployment
The app deploys via Replit's built-in deployment system. The proxy routes traffic:
- `/api/*` → port 8080 (API server)  
- `/*` → port 18115 (Expo web app)

### Production Checklist
- [ ] Set `NODE_ENV=production` in API server env
- [ ] Set strong `JWT_SECRET` (min 32 random characters)
- [ ] Configure Cloudflare R2 bucket with public access for CDN delivery
- [ ] Run `pnpm run --filter @workspace/db push` to ensure schema is up to date
- [ ] Create admin account (register → set role='admin' in DB)
- [ ] Populate settings via admin panel (Easypaisa info, social links, legal content)
- [ ] Upload at least one product to test the full purchase flow

### Replit Artifact Configuration
Each service is registered as a Replit artifact:
- `mobile` (kind: expo) → serves on `PORT` env var, proxy at `/`
- `api-server` (kind: api) → serves on `PORT` env var, proxy at `/api`

---

## Quick Rebuild Checklist

To rebuild this exact app from scratch:

1. **Create monorepo** with pnpm workspaces
2. **Set up shared DB package** with Drizzle ORM and the schema above
3. **Build API server** with Express + the route structure above
4. **Initialize Expo app** with expo-router, expo-google-fonts (Inter), @expo/vector-icons
5. **Build AppContext** with cart (AsyncStorage), orders, products, wishlist, dark mode
6. **Build AuthContext** with JWT token management via AsyncStorage
7. **Create API service** (`services/api.ts`) as a typed fetch wrapper reading token from AsyncStorage
8. **Build screens** in the order: auth → tabs → product detail → checkout → admin
9. **Apply design system**: Colors.ts with gold/charcoal/off-white palette, Inter fonts
10. **Set up R2** for image uploads
11. **Deploy** via Replit with artifact proxy configuration

---

*Generated for Almera v1.0.0 — March 2026*
