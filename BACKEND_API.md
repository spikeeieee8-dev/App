# Almera Backend API — Documentation

## Overview

The Almera backend is a REST API built with **Express 5** and **TypeScript**. It powers the mobile app and can be used to integrate any website or third-party client.

All data is currently stored **in-memory** — it resets on server restart. See the [Switching to a Persistent Database](#switching-to-a-persistent-database) section when you're ready to go to production.

---

## Base URL

| Environment | URL |
|---|---|
| Replit Dev | `https://<your-replit-domain>/api` |
| Production (after deploy) | `https://<your-deployed-domain>/api` |

Your current dev base URL:
```
https://e0c0095e-7334-4ebe-9576-74ede344ded2-00-2uryjxhnnao7c.sisko.replit.dev/api
```

---

## Authentication

Most endpoints require a **Bearer token**. Obtain a token by logging in or registering.

Include the token in every protected request:
```
Authorization: Bearer <token>
```

Tokens are stored in memory — they expire if the server restarts.

**Admin credentials (dev/demo):**
- Email: `admin@almera.pk`
- Password: `admin123`

---

## CORS (Website Integration)

The API currently accepts requests from **any origin** — your website can call it directly from the browser with no extra setup.

```js
// Example: calling the API from your website
const res = await fetch("https://<your-replit-domain>/api/products");
const data = await res.json();
```

To restrict CORS to your website's domain in production, update `artifacts/api-server/src/app.ts`:
```ts
app.use(cors({ origin: "https://your-website.com" }));
```

---

## Error Responses

All errors return JSON in the format:
```json
{ "error": "Description of the error" }
```

| Status | Meaning |
|---|---|
| 400 | Bad request / missing required fields |
| 401 | Not authenticated |
| 403 | Forbidden (not admin) |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already taken) |

---

## Endpoints

### Health

#### `GET /api/health`
Check if the server is running.

**Response:**
```json
{ "status": "ok" }
```

---

### Auth

#### `POST /api/auth/register`
Create a new customer account.

**Body:**
```json
{
  "name": "Ali Hassan",
  "email": "ali@example.com",
  "password": "secret123",
  "phone": "03001234567"
}
```

**Response:**
```json
{
  "user": {
    "id": "USR-...",
    "name": "Ali Hassan",
    "email": "ali@example.com",
    "role": "user",
    "phone": "03001234567",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "<session-token>"
}
```

---

#### `POST /api/auth/login`
Log in and receive a session token.

**Body:**
```json
{
  "email": "ali@example.com",
  "password": "secret123"
}
```

**Response:** Same as register.

---

#### `GET /api/auth/me`
Get the currently authenticated user. **Requires auth.**

**Response:**
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "..." }
}
```

---

#### `PATCH /api/auth/profile`
Update the user's name and phone. **Requires auth.**

**Body:**
```json
{
  "name": "Ali Hassan Updated",
  "phone": "03009876543"
}
```

**Response:**
```json
{ "user": { ... } }
```

---

#### `PATCH /api/auth/password`
Change password. **Requires auth.**

**Body:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

**Response:**
```json
{ "success": true }
```

---

#### `POST /api/auth/logout`
Invalidate the session token. **Requires auth.**

**Response:**
```json
{ "success": true }
```

---

### Products

#### `GET /api/products`
List all active products. Public — no auth required.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `category` | `"men"` \| `"women"` | Filter by gender category |
| `active` | `"true"` \| `"false"` | Filter by active status (admin use) |

**Response:**
```json
{
  "products": [
    {
      "id": "p001",
      "name": "Premium Merino Polo",
      "description": "...",
      "category": "men",
      "subcategory": "Polos",
      "originalPrice": 8500,
      "discountedPrice": 5999,
      "costPrice": 3200,
      "images": [],
      "variants": [
        { "size": "M", "color": "Midnight Black", "stock": 12 }
      ],
      "tags": ["polo", "formal", "merino"],
      "isNew": true,
      "isFeatured": true,
      "urgencyText": "Only 3 left in black",
      "viewingCount": 12,
      "isActive": true,
      "createdAt": "..."
    }
  ],
  "total": 8
}
```

---

#### `GET /api/products/:id`
Get a single product by ID. Public.

**Response:**
```json
{ "product": { ... } }
```

---

#### `POST /api/products`
Create a new product. **Requires admin.**

**Body:**
```json
{
  "name": "New Shirt",
  "description": "A great shirt",
  "category": "men",
  "subcategory": "Clothing",
  "originalPrice": 5000,
  "discountedPrice": 3500,
  "costPrice": 2000,
  "variants": [
    { "size": "M", "color": "White", "stock": 10 }
  ],
  "tags": ["shirt", "casual"],
  "isNew": true,
  "isFeatured": false
}
```

**Response:**
```json
{ "product": { "id": "...", ... } }
```

---

#### `PUT /api/products/:id`
Update any product field. **Requires admin.**

**Body:** Any subset of product fields (partial update supported).

**Response:**
```json
{ "product": { ... } }
```

---

#### `DELETE /api/products/:id`
Soft-delete a product (sets `isActive: false`). **Requires admin.**

**Response:**
```json
{ "success": true }
```

---

### Orders

#### `GET /api/orders`
List orders. **Requires auth.**
- Regular users see only their own orders.
- Admins see all orders.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by order status |

**Order statuses:** `pending` · `awaiting_verification` · `verified` · `dispatched` · `delivered` · `cancelled`

**Response:**
```json
{
  "orders": [
    {
      "id": "ORD-...",
      "userId": "USR-...",
      "items": [
        {
          "productId": "p001",
          "productName": "Premium Merino Polo",
          "productPrice": 5999,
          "size": "M",
          "color": "Midnight Black",
          "quantity": 2
        }
      ],
      "subtotal": 11998,
      "shippingCost": 200,
      "total": 12198,
      "status": "pending",
      "paymentMethod": "cod",
      "address": {
        "name": "Ali Hassan",
        "phone": "03001234567",
        "address": "House 12, Street 4",
        "city": "Lahore",
        "province": "Punjab"
      },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1
}
```

---

#### `GET /api/orders/:id`
Get a single order. **Requires auth.** Users can only access their own orders.

**Response:**
```json
{ "order": { ... } }
```

---

#### `POST /api/orders`
Place a new order. **Requires auth.**

**Payment methods:** `cod` (Cash on Delivery) · `jazzcash` · `easypaid`

**Body:**
```json
{
  "items": [
    {
      "productId": "p001",
      "productName": "Premium Merino Polo",
      "productPrice": 5999,
      "size": "M",
      "color": "Midnight Black",
      "quantity": 1
    }
  ],
  "subtotal": 5999,
  "shippingCost": 200,
  "total": 6199,
  "paymentMethod": "cod",
  "paymentProofUri": null,
  "address": {
    "name": "Ali Hassan",
    "phone": "03001234567",
    "address": "House 12, Street 4",
    "city": "Lahore",
    "province": "Punjab"
  }
}
```

**Response:**
```json
{ "order": { "id": "ORD-...", "status": "pending", ... } }
```

**Status on creation:**
- `cod` → `pending`
- `jazzcash` / `easypaid` → `awaiting_verification`

---

#### `PUT /api/orders/:id/status`
Update order status. **Requires admin.**

**Body:**
```json
{
  "status": "dispatched",
  "courierName": "TCS",
  "courierTrackingId": "TCS1234567",
  "notes": "Dispatched via TCS Express"
}
```

**Response:**
```json
{ "order": { ... } }
```

---

### Analytics (Admin only)

All analytics endpoints **require admin auth.**

#### `GET /api/analytics`
Full dashboard summary — revenue, profit, order counts, top products.

**Response:**
```json
{
  "totalRevenue": 250000,
  "totalProfit": 120000,
  "totalOrders": 42,
  "pendingOrders": 5,
  "deliveredOrders": 30,
  "topProducts": [ ... ],
  "recentOrders": [ ... ]
}
```

---

#### `GET /api/analytics/users`
List all registered users.

**Response:**
```json
{
  "users": [
    { "id": "USR-...", "name": "...", "email": "...", "role": "user", "createdAt": "..." }
  ],
  "total": 10
}
```

---

#### `DELETE /api/analytics/users/:id`
Delete a user account.

**Response:**
```json
{ "success": true }
```

---

#### `PATCH /api/analytics/users/:id/role`
Change a user's role.

**Body:**
```json
{ "role": "admin" }
```

**Response:**
```json
{ "user": { ... } }
```

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `id` | string | Format: `USR-<timestamp>-<random>` |
| `name` | string | |
| `email` | string | Unique |
| `role` | `"user"` \| `"admin"` | |
| `phone` | string? | Optional |
| `createdAt` | ISO date string | |

### Product
| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `description` | string | |
| `category` | `"men"` \| `"women"` | |
| `subcategory` | string | e.g. `"Polos"`, `"Clothing"`, `"Accessories"` |
| `originalPrice` | number | PKR |
| `discountedPrice` | number | PKR — selling price |
| `costPrice` | number | PKR — used to calculate profit |
| `images` | string[] | Array of image URLs |
| `variants` | `ProductVariant[]` | Size + color + stock |
| `tags` | string[] | |
| `isNew` | boolean? | |
| `isFeatured` | boolean? | |
| `urgencyText` | string? | e.g. "Only 3 left" |
| `viewingCount` | number? | Shown on product page |
| `isActive` | boolean | false = soft deleted |
| `createdAt` | ISO date string | |

### ProductVariant
| Field | Type |
|---|---|
| `size` | string |
| `color` | string |
| `stock` | number |

### Order
| Field | Type | Notes |
|---|---|---|
| `id` | string | Format: `ORD-...` |
| `userId` | string | |
| `items` | `CartItem[]` | |
| `subtotal` | number | PKR |
| `shippingCost` | number | PKR |
| `total` | number | PKR |
| `status` | OrderStatus | See statuses above |
| `paymentMethod` | `"cod"` \| `"jazzcash"` \| `"easypaid"` | |
| `paymentProofUri` | string? | For manual payment verification |
| `address` | Address object | |
| `courierTrackingId` | string? | Set on dispatch |
| `courierName` | string? | Set on dispatch |
| `notes` | string? | Admin notes |
| `createdAt` | ISO date string | |
| `updatedAt` | ISO date string | |

---

## Website Integration — Quick Start

Here is a minimal JavaScript snippet to call the API from any website:

```js
const API_BASE = "https://<your-replit-domain>/api";

// 1. Login
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  localStorage.setItem("token", data.token);
  return data.user;
}

// 2. Authenticated request helper
async function apiCall(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// 3. Example usage
const products = await apiCall("/products");
const myOrders = await apiCall("/orders");
```

---

## Switching to a Persistent Database

The current backend uses an **in-memory store** — all data resets on server restart. When you're ready for production:

1. Provision a **PostgreSQL database** (Replit has a built-in one)
2. The project already has Drizzle ORM installed under `lib/db/`
3. Replace `store.ts` calls with Drizzle queries
4. Run migrations: `pnpm --filter @workspace/db push`

See `ALMERA_GUIDE.md` for step-by-step instructions.

---

## Adding New Endpoints

All routes live in `artifacts/api-server/src/routes/`. To add a new route:

1. Create or edit a file in that folder
2. Register it in `artifacts/api-server/src/routes/index.ts`
3. Use `requireAuth` or `requireAdmin` middleware as needed
4. The server hot-reloads automatically in development

```ts
// Example: artifacts/api-server/src/routes/wishlist.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.json({ items: [] });
});

export default router;
```
