# Almera — Premium Pakistani Fashion App

## Overview

Full-stack mobile e-commerce app built as a TypeScript pnpm monorepo. Production-ready with PostgreSQL, JWT auth, security middleware, background jobs, and a full-featured Expo mobile app.

## Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Express 5, TypeScript, tsx (dev), Drizzle ORM + PostgreSQL
- **Mobile**: Expo SDK 54, React Native, Expo Router, React Query, expo-notifications
- **Auth**: bcrypt password hashing, JWT tokens (stored in AsyncStorage on mobile)
- **Security**: Helmet, express-rate-limit (100/min global, 20/15min auth routes)
- **Background Jobs**: BullMQ + Redis (gracefully skips if REDIS_URL not set)
- **Image Upload**: Cloudflare R2 via AWS S3-compatible SDK
- **Metrics**: Prometheus via prom-client at `/metrics`

## Structure

```
artifacts/
  api-server/         Express API server (port 3000 in Start Backend workflow)
    src/
      routes/         auth.ts, products.ts, orders.ts, analytics.ts, upload.ts, metrics-route.ts
      lib/
        db.ts         Drizzle ORM + pg connection
        jwt.ts        JWT sign/verify helpers
        r2.ts         Cloudflare R2 upload service
        metrics.ts    Prometheus counters/histograms
        seed.ts       DB seeder (admin user + sample products)
      middlewares/    auth.ts (requireAuth / requireAdmin)
      workers/        BullMQ: order confirmation, analytics, cart cleanup
  mobile/             Expo React Native app
    app/
      (tabs)/         Home, Shop, Cart, Orders, Profile
      auth/           login.tsx, register.tsx
      account/        edit.tsx (profile editing + password change)
      admin/          index.tsx, login.tsx, orders.tsx, products.tsx, users.tsx, settings.tsx (payment settings)
      product/[id]    Product detail screen
      order/[id]      Order detail screen with status timeline
      checkout.tsx    Checkout flow
      order-success   Confirmation + push notification trigger
    context/
      AppContext.tsx   Products (fetched from API), orders (synced from API), cart/wishlist/darkmode
      AuthContext.tsx  Auth state, login/register/logout/updateProfile/changePassword
    services/
      api.ts          All API calls (auth, products w/ search/featured params, orders, analytics)
      notifications.ts  expo-notifications: request permission, schedule local push notifications
    constants/
      colors.ts       Light (white) + dark theme tokens + brand colors
lib/
  db/                 Shared Drizzle schema + migrations
    src/schema/       users, products, product_variants, orders, order_items, addresses, analytics_events, settings
```

## Database Schema (PostgreSQL via Drizzle ORM)

- **users** — id (uuid), email, name, passwordHash, phone, role (user/admin)
- **products** — id, name, description, category, subcategory, prices (original/discounted/cost), images, tags, isNew, isFeatured, isActive
- **product_variants** — productId FK, size, color, stock, reservedStock
- **orders** — userId FK, status, paymentMethod, paymentProofUri, subtotal, shippingCost, total, address (jsonb), courierTrackingId, notes
- **order_items** — orderId FK, productId FK, productName, size, color, quantity, price
- **addresses** — userId FK, saved shipping addresses
- **analytics_events** — userId, eventType, payload (jsonb)
- **settings** — key (PK varchar), value (text) — stores easypaisa_number, easypaisa_name, easypaisa_qr_url

## API Endpoints

- `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/me`
- `PATCH /api/auth/profile` / `PATCH /api/auth/password` / `POST /api/auth/logout`
- `GET /api/products` — supports `?search=`, `?category=`, `?featured=`, `?active=`
- `GET /api/products/:id` / `POST /api/products` / `PUT /api/products/:id` / `DELETE /api/products/:id`
- `GET /api/orders` / `POST /api/orders` / `GET /api/orders/:id` / `PUT /api/orders/:id/status`
- `GET /api/analytics` / `GET /api/analytics/users`
- `POST /api/upload` — multipart image/video upload to Cloudflare R2 (field name: `file`)
- `GET /api/settings/public` — public Easypaisa settings (no auth)
- `GET /api/settings` / `PUT /api/settings/:key` — admin-only settings management
- `GET /metrics` — Prometheus metrics

## Theme System

- **Default**: Pure white light theme (`#FFFFFF` background)
- **Dark**: Activates when `isDarkMode` toggle is ON **or** system preference is dark
- `isDarkMode` is persisted in AsyncStorage, starts as `false` (light mode)

## Auth System

- **Admin credentials**: admin@almera.pk / admin123 (seeded in PostgreSQL)
- JWT tokens expire in 7 days
- Rate limit: 20 login attempts per 15 minutes

## Mobile — AppContext Behavior

- **Products**: Fetched from API on mount. SAMPLE_PRODUCTS shown as fallback while loading. `productsLoading` state available.
- **Orders**: Fetched from API on mount (requires auth token). Refreshed on orders tab focus. Refreshed after placing new order.
- **Cart/Wishlist/DarkMode**: Local state persisted in AsyncStorage.

## Push Notifications (expo-notifications)

- Permission requested on app launch
- Local notification scheduled after order placement (from order-success screen)
- `scheduleOrderConfirmationNotification(orderId)` and `scheduleOrderStatusNotification(orderId, status)` available in services/notifications.ts
- Web platform: notifications silently skipped (native only)

## Admin Panel

Access: Profile tab → Admin Dashboard (visible only when logged in as admin role)

## Workflows

- **Start Backend**: `PORT=3000 pnpm --filter @workspace/api-server run dev`
- **Start application**: Expo dev server on port 8080

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string (provisioned)
- `JWT_SECRET` — JWT signing secret
- `REDIS_URL` — (optional) BullMQ; workers skip gracefully if not set
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` — Cloudflare R2
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — email via Nodemailer (order confirmations)

## Important Files

- `lib/db/src/schema/index.ts` — Full Drizzle ORM schema
- `artifacts/api-server/src/app.ts` — Express app with security middleware
- `artifacts/api-server/src/lib/seed.ts` — DB seed (run once)
- `artifacts/mobile/context/AppContext.tsx` — Global state, API integration
- `artifacts/mobile/services/api.ts` — Mobile API client
- `artifacts/mobile/services/notifications.ts` — Push notification helpers
- `artifacts/mobile/constants/colors.ts` — All theme colors
