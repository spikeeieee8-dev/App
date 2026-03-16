# Almera — Complete Step-by-Step Build Guide

This guide explains exactly how Almera is built, how the backend and mobile app connect, and how to recreate the entire project from scratch.

---

## Table of Contents

1. [What Almera Is](#1-what-almera-is)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Setting Up the Workspace (Monorepo)](#4-setting-up-the-workspace-monorepo)
5. [Building the Backend (API Server)](#5-building-the-backend-api-server)
6. [Building the Mobile App](#6-building-the-mobile-app)
7. [How the Backend and App Connect](#7-how-the-backend-and-app-connect)
8. [Database Setup](#8-database-setup)
9. [Authentication Flow](#9-authentication-flow)
10. [Product Management](#10-product-management)
11. [Order Flow (Customer to Admin)](#11-order-flow-customer-to-admin)
12. [Image / File Uploads](#12-image--file-uploads)
13. [Admin Panel](#13-admin-panel)
14. [Dark Mode & App Preferences](#14-dark-mode--app-preferences)
15. [Environment Variables & Secrets](#15-environment-variables--secrets)
16. [Running Locally on Replit](#16-running-locally-on-replit)
17. [Deploying to Production](#17-deploying-to-production)

---

## 1. What Almera Is

Almera is a **full-stack e-commerce mobile app** for a premium clothing brand based in Pakistan. It has:

- A **customer-facing mobile app** (Expo / React Native) where users can browse products, add to cart, place orders (COD or payment proof), track orders, and manage a wishlist.
- An **admin panel** built inside the same mobile app (accessible to admin-role users) for managing products, orders, users, and analytics.
- A **Node.js/Express backend** that serves a REST API, handles authentication, stores data in PostgreSQL, and supports file uploads to Cloudflare R2 (or local storage as fallback).

---

## 2. Technology Stack

### Backend
| Tool | Purpose |
|------|---------|
| Node.js + TypeScript | Runtime + type safety |
| Express 5 | HTTP server / REST API |
| Drizzle ORM | Database query builder |
| PostgreSQL | Main database |
| JSON Web Tokens (JWT) | Authentication |
| bcrypt | Password hashing |
| BullMQ + Redis | Background job queues |
| Cloudflare R2 (or local storage) | File/image storage |
| Prometheus (`prom-client`) | Metrics |

### Mobile App
| Tool | Purpose |
|------|---------|
| Expo SDK 54 | React Native framework |
| Expo Router | File-based navigation |
| React Context API | Global state (cart, products, dark mode) |
| TanStack React Query | (available, used optionally) |
| AsyncStorage | Local persistence |
| expo-image-picker | Camera/gallery access |
| expo-notifications | Push notifications |
| expo-haptics | Tactile feedback |
| react-native-reanimated | Animations |

---

## 3. Project Structure

```
workspace/
├── artifacts/
│   ├── api-server/          ← Express backend
│   │   ├── src/
│   │   │   ├── app.ts       ← Express app setup (CORS, middleware, static files)
│   │   │   ├── index.ts     ← Server entry point (starts on PORT)
│   │   │   ├── lib/
│   │   │   │   ├── db.ts    ← Drizzle ORM + PostgreSQL connection
│   │   │   │   ├── jwt.ts   ← Sign/verify tokens
│   │   │   │   ├── r2.ts    ← Cloudflare R2 file upload
│   │   │   │   ├── cache.ts ← In-memory cache (product lists)
│   │   │   │   └── queue.ts ← BullMQ setup
│   │   │   ├── middlewares/
│   │   │   │   └── auth.ts  ← requireAuth / requireAdmin middleware
│   │   │   └── routes/
│   │   │       ├── auth.ts      ← /api/auth (login, register, profile)
│   │   │       ├── products.ts  ← /api/products (CRUD)
│   │   │       ├── orders.ts    ← /api/orders (create, list, status update)
│   │   │       ├── upload.ts    ← /api/upload (file upload → R2 or local)
│   │   │       ├── analytics.ts ← /api/analytics (admin stats, users)
│   │   │       ├── settings.ts  ← /api/settings (store config)
│   │   │       └── cart.ts      ← /api/cart (reserve/release stock)
│   │   └── uploads/         ← Local file storage (when R2 not configured)
│   └── mobile/
│       ├── app/
│       │   ├── index.tsx        ← Welcome/splash screen
│       │   ├── _layout.tsx      ← Root layout (fonts, providers)
│       │   ├── (tabs)/
│       │   │   ├── index.tsx    ← Home tab (featured products)
│       │   │   ├── shop.tsx     ← Browse all products
│       │   │   ├── cart.tsx     ← Cart tab
│       │   │   ├── orders.tsx   ← Order history
│       │   │   └── profile.tsx  ← Profile, settings, dark mode
│       │   ├── product/[id].tsx ← Product detail page
│       │   ├── checkout.tsx     ← Checkout form + payment
│       │   ├── admin/
│       │   │   ├── index.tsx    ← Admin dashboard
│       │   │   ├── products.tsx ← Add/delete products
│       │   │   ├── orders.tsx   ← Manage orders
│       │   │   ├── users.tsx    ← View/manage users
│       │   │   └── settings.tsx ← Store settings
│       │   └── auth/
│       │       ├── login.tsx
│       │       └── register.tsx
│       ├── context/
│       │   ├── AppContext.tsx   ← Products, cart, wishlist, orders, dark mode
│       │   └── AuthContext.tsx  ← User auth state
│       ├── services/
│       │   └── api.ts           ← All API calls to the backend
│       └── constants/
│           └── colors.ts        ← Brand color palette
└── lib/
    ├── db/                      ← Shared Drizzle schema + migrations
    └── api-zod/                 ← Shared Zod validation schemas
```

---

## 4. Setting Up the Workspace (Monorepo)

Almera uses **pnpm workspaces** to manage multiple packages in one repo.

### Step 1: Initialize the monorepo

```bash
mkdir almera && cd almera
pnpm init
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'artifacts/*'
  - 'lib/*'
```

### Step 2: Create workspace packages

Each folder under `artifacts/` and `lib/` has its own `package.json`. The root `package.json` has workspace-level scripts.

### Step 3: Install all dependencies

```bash
pnpm install
```

This installs everything across all packages at once.

---

## 5. Building the Backend (API Server)

### Step 1: Initialize

```bash
mkdir -p artifacts/api-server/src
cd artifacts/api-server
pnpm init
```

Add to `package.json`:
```json
{
  "name": "@workspace/api-server",
  "scripts": {
    "dev": "tsx ./src/index.ts",
    "build": "tsc"
  }
}
```

### Step 2: Install dependencies

```bash
pnpm add express drizzle-orm pg jsonwebtoken bcrypt multer cors helmet express-rate-limit
pnpm add -D tsx typescript @types/express @types/pg @types/jsonwebtoken @types/bcrypt
```

### Step 3: Create the Express app (`src/app.ts`)

Key responsibilities:
- Set up CORS (allow all origins in dev, restrict in production)
- Add `helmet` for security headers (with `crossOriginResourcePolicy: cross-origin` so images load across domains)
- Add rate limiting
- Mount all routes under `/api`
- Serve the `uploads/` folder as static files at `/uploads`

```typescript
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", router);
```

### Step 4: Create routes

Each resource gets its own route file:

- **`/api/auth`** — POST `/login`, POST `/register`, GET `/me`, PATCH `/profile`
- **`/api/products`** — GET `/` (list), GET `/:id`, POST `/` (admin), PUT `/:id` (admin), DELETE `/:id` (admin, soft-delete)
- **`/api/orders`** — GET `/` (user's orders), GET `/:id`, POST `/` (create), PUT `/:id/status` (admin)
- **`/api/upload`** — POST `/` (admin, upload image to R2 or local disk)
- **`/api/analytics`** — GET `/` (admin summary), GET `/users`

### Step 5: Database connection (`src/lib/db.ts`)

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@workspace/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

### Step 6: Auth middleware (`src/middlewares/auth.ts`)

```typescript
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyToken(token); // uses jsonwebtoken
  req.user = payload;
  next();
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  });
};
```

---

## 6. Building the Mobile App

### Step 1: Initialize with Expo

```bash
cd artifacts/mobile
pnpm create expo-app . --template blank-typescript
```

Or manually add:
```bash
pnpm add expo expo-router react-native expo-font expo-status-bar
```

### Step 2: Configure Expo Router

In `app.json`:
```json
{
  "expo": {
    "scheme": "almera",
    "web": { "bundler": "metro" }
  }
}
```

In `metro.config.js`, enable workspace support:
```js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../..")];
module.exports = config;
```

### Step 3: Set up fonts

In `app/_layout.tsx`, load Inter fonts using `expo-font`:
```typescript
await Font.loadAsync({
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold
});
```

### Step 4: Global state (AppContext)

`context/AppContext.tsx` holds:
- **products** — fetched from the API on startup
- **cart** — stored in AsyncStorage, persisted across sessions
- **wishlist** — array of product IDs, persisted
- **orders** — fetched from API when authenticated
- **isDarkMode** — persisted to AsyncStorage

### Step 5: API service (`services/api.ts`)

The entire API is wrapped in one file. The base URL is:

```typescript
const getApiBase = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
```

The `EXPO_PUBLIC_DOMAIN` environment variable is injected by the Replit workflow and points to the backend.

---

## 7. How the Backend and App Connect

This is the most important part to understand.

### Architecture

```
Mobile App (Expo)
      │
      │  HTTPS requests (REST API)
      ▼
Backend (Express on PORT 3000)
      │
      │  SQL queries
      ▼
PostgreSQL Database
```

### Connection in detail

1. The **backend** starts on `PORT=3000` and exposes all routes under `/api`.
2. The **mobile app** uses `EXPO_PUBLIC_DOMAIN` (set to the Replit dev domain) to construct the base API URL: `https://<your-replit-domain>/api`
3. All requests use `fetch()` with `Content-Type: application/json`.
4. Protected routes require the `Authorization: Bearer <token>` header.
5. The token is obtained during login and stored in **AsyncStorage**.

### Example: Loading products

```
App starts
  → AppContext.useEffect triggers
  → api.products.list({ active: true }) called
  → GET https://<domain>/api/products?active=true
  → Backend queries PostgreSQL for active products
  → Returns JSON { products: [...], total: N }
  → App stores products in state
  → UI renders product cards
```

### Example: Placing an order

```
User taps "Place Order"
  → api.orders.create(orderData) called
  → POST https://<domain>/api/orders
  → Header: Authorization: Bearer <token>
  → Backend validates token, creates order in DB
  → Returns { order: { id, status: "pending", ... } }
  → App adds order to local state
  → User is redirected to order-success screen
```

### Local development URL

In Replit, the workflow automatically sets:
- `PORT=3000` for the backend
- `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN` for the mobile app

The Replit dev domain is a unique HTTPS URL like `abc123.repl.co` that proxies to your running server.

---

## 8. Database Setup

The database schema is defined in `lib/db/` using Drizzle ORM.

### Tables

| Table | Purpose |
|-------|---------|
| `users` | id, name, email, passwordHash, role (user/admin), phone, createdAt |
| `products` | id, name, description, category, subcategory, prices, images[], tags[], isActive, isFeatured, isNew |
| `product_variants` | id, productId, size, color, stock, reservedStock |
| `orders` | id, userId, items (JSONB), address (JSONB), total, status, paymentMethod |
| `settings` | key, value (store configuration key-value pairs) |

### Running migrations

```bash
pnpm --filter @workspace/db run migrate
```

Or to push the schema directly in development:
```bash
pnpm --filter @workspace/db run push
```

---

## 9. Authentication Flow

### Registration

1. User submits name, email, password
2. Backend hashes password with bcrypt (`bcrypt.hash(password, 12)`)
3. Inserts new user into `users` table with `role = "user"`
4. Returns `{ user, token }` — token is a signed JWT

### Login

1. User submits email + password
2. Backend looks up user by email
3. Compares password with `bcrypt.compare()`
4. If match, signs a JWT with `{ userId, role }` payload (expires in 30 days)
5. Returns `{ user, token }`

### Token usage

The app stores the token in AsyncStorage:
```typescript
await AsyncStorage.setItem("auth_token", token);
```

Every authenticated request includes:
```
Authorization: Bearer <token>
```

### Admin access

The first user can be made admin by directly updating the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or via the admin panel's user management screen.

---

## 10. Product Management

### Data model

Each product has:
- Basic info: name, description, category (men/women), subcategory
- Prices: originalPrice, discountedPrice, costPrice (all in PKR)
- Media: images[] (URLs), tags[]
- Flags: isActive, isNew, isFeatured
- Variants: separate table with size + color + stock per combination

### Adding a product (admin)

1. Admin opens the product creation form in the app
2. Fills in name, prices, category, subcategory
3. Types sizes (e.g. `S, M, L, XL`) and colours (e.g. `Black, White, Navy`) — comma-separated
4. Taps "Add" → generates all size × colour combinations as variants
5. Picks images from device gallery
6. Taps "Save"
7. App uploads images to backend (`POST /api/upload`)
8. Backend saves file locally (or to R2) and returns a URL
9. App sends `POST /api/products` with all data including image URLs
10. Backend inserts product + variants into the database

### Deleting a product

- DELETE `/api/products/:id` sets `isActive = false` (soft delete)
- The product list query filters `WHERE isActive = true` by default
- Deleted products disappear from all user-facing screens immediately

---

## 11. Order Flow (Customer to Admin)

### Customer side

1. Customer browses products → selects size + colour → adds to cart
2. Cart is persisted in AsyncStorage
3. Customer goes to checkout → fills in name, phone, address, city, province
4. Selects payment: Cash on Delivery, EasyPaisa, or JazzCash
5. For online payment: uploads payment screenshot
6. Taps "Place Order" → `POST /api/orders`
7. Order is created with `status = "pending"`

### Admin side

1. Admin opens Orders screen in the admin panel
2. Sees all orders with current status
3. Can update status through the pipeline:
   ```
   pending → awaiting_verification → verified → dispatched → delivered
                                                            ↘ cancelled
   ```
4. When dispatching, admin can enter courier name + tracking ID
5. Customer can see real-time status on their Orders tab

---

## 12. Image / File Uploads

### How it works

1. Admin picks an image from device gallery using `expo-image-picker`
2. App sends `POST /api/upload` with the file as `multipart/form-data`
3. Backend checks if Cloudflare R2 is configured:
   - **If R2 is set up**: uploads to R2 bucket, returns the public R2 URL
   - **If R2 is not set up**: saves the file to `artifacts/api-server/uploads/` on disk and returns a local URL (`https://<domain>/uploads/<filename>`)
4. The returned URL is stored in the product's `images[]` array

### Setting up Cloudflare R2 (optional, for production)

1. Create a Cloudflare account
2. Create an R2 bucket
3. Create an API token with R2 read/write permission
4. Set these environment variables:
   ```
   R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=<your-key>
   R2_SECRET_ACCESS_KEY=<your-secret>
   R2_BUCKET=almera-uploads
   R2_PUBLIC_URL=https://cdn.yourdomain.com
   ```

---

## 13. Admin Panel

The admin panel is a set of screens only visible to users with `role = "admin"`.

### Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Dashboard | `/admin` | Summary stats (revenue, orders, users) |
| Products | `/admin/products` | Add new products, view all, delete |
| Orders | `/admin/orders` | View and update order statuses |
| Users | `/admin/users` | View all users, change roles, delete |
| Settings | `/admin/settings` | Store config (WhatsApp number, etc.) |

### Access control

- The Profile tab shows "Admin Dashboard" button only if `user.role === "admin"`
- All admin API routes use `requireAdmin` middleware that checks the JWT role

---

## 14. Dark Mode & App Preferences

Dark mode state lives in `AppContext`:

```typescript
const [isDarkMode, setIsDarkModeState] = useState(false);

const setDarkMode = (v: boolean) => {
  setIsDarkModeState(v);
  AsyncStorage.setItem("darkMode", JSON.stringify(v));
};
```

On startup, the app reads the saved value:
```typescript
const d = await AsyncStorage.getItem("darkMode");
if (d) setIsDarkModeState(JSON.parse(d));
```

Every screen reads from `useApp().isDarkMode` and picks the correct theme:
```typescript
const isDark = isDarkMode || colorScheme === "dark";
const theme = isDark ? Colors.dark : Colors.light;
```

---

## 15. Environment Variables & Secrets

### Backend (set in Replit Secrets)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | Yes (set by workflow) | Server port (3000) |
| `R2_ENDPOINT` | No | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | No | R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | R2 secret key |
| `R2_BUCKET` | No | R2 bucket name |
| `R2_PUBLIC_URL` | No | Public base URL for R2 files |
| `REPLIT_DEV_DOMAIN` | Auto | Your Replit domain (auto-set) |

### Mobile App

| Variable | Set By | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_DOMAIN` | Workflow | Points to the Replit backend domain |

---

## 16. Running Locally on Replit

Two workflows run simultaneously:

### Workflow 1: Start Backend
```
PORT=3000 pnpm --filter @workspace/api-server run dev
```
Starts the Express API on port 3000.

### Workflow 2: Start application
```
pnpm --filter @workspace/mobile run dev
```
Starts the Expo dev server with web preview on port 8080.

### First-time setup

1. Install dependencies: `pnpm install`
2. Set `DATABASE_URL` and `JWT_SECRET` in Replit Secrets
3. Run database migrations: `pnpm --filter @workspace/db run push`
4. Start both workflows

---

## 17. Deploying to Production

### Backend deployment

1. Build the TypeScript: `pnpm --filter @workspace/api-server run build`
2. Deploy to a VPS, Railway, Render, or Fly.io
3. Set all environment variables
4. Run database migrations
5. Start with: `node dist/index.js`

### Mobile app deployment (app stores)

1. Install EAS CLI: `pnpm add -g eas-cli`
2. Login: `eas login`
3. Build for Android: `eas build --platform android`
4. Build for iOS: `eas build --platform ios`
5. Submit to stores: `eas submit`

The `eas.json` in the mobile folder has the build profiles configured.

### Important production checklist

- [ ] Set `ALLOWED_ORIGINS` to your production domain on the backend
- [ ] Use a strong random `JWT_SECRET` (at least 32 characters)
- [ ] Configure Cloudflare R2 for persistent image storage
- [ ] Set up Redis for BullMQ background jobs
- [ ] Update `EXPO_PUBLIC_DOMAIN` in `app.json` to your production backend URL
- [ ] Change the WhatsApp number in `profile.tsx` to your real support number

---

*Last updated: March 2026 — Almera v1.0.0*
