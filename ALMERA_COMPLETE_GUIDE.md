# Almera — Complete Setup, API & Deployment Guide

A full end-to-end guide covering everything from local development to production VPS deployment.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Local Development Setup](#2-local-development-setup)
3. [Backend API Reference](#3-backend-api-reference)
4. [Database — Switching to PostgreSQL](#4-database--switching-to-postgresql)
5. [File Storage with Cloudflare R2](#5-file-storage-with-cloudflare-r2)
6. [Deploying the Backend to a VPS](#6-deploying-the-backend-to-a-vps)
7. [Domain & SSL Setup](#7-domain--ssl-setup)
8. [CORS — Connecting Your Website](#8-cors--connecting-your-website)
9. [Building the Android APK](#9-building-the-android-apk)
10. [Publishing to Google Play Store](#10-publishing-to-google-play-store)
11. [Building for iOS](#11-building-for-ios)
12. [Website Integration](#12-website-integration)
13. [Environment Variables Reference](#13-environment-variables-reference)
14. [Production Checklist](#14-production-checklist)
15. [Recommended VPS Providers](#15-recommended-vps-providers)

---

## 1. Project Overview

**Almera** is a full-stack e-commerce platform for a premium fashion brand in Pakistan. It consists of:

| Component | Tech | Description |
|---|---|---|
| Backend API | Express 5, TypeScript, Node.js 20 | REST API — auth, products, orders, analytics |
| Mobile App | Expo SDK 52, React Native | iOS + Android shopping app |
| Admin Panel | Built into the mobile app | Order management, inventory, analytics |

**Current data storage:** In-memory (resets on restart). Switch to PostgreSQL before going live — see Section 4.

**Admin credentials (change before going live):**
- Email: `admin@almera.pk`
- Password: `admin123`

---

## 2. Local Development Setup

### Requirements

- Node.js 20+ — https://nodejs.org
- pnpm — `npm install -g pnpm`

### Install & Run

```bash
# Clone the project
git clone <your-repo-url>
cd almera

# Install all dependencies
pnpm install

# Start the backend API (runs on port 3000)
PORT=3000 pnpm --filter @workspace/api-server run dev

# In a separate terminal — start the mobile app (web preview)
pnpm --filter @workspace/mobile run dev
```

The mobile app web preview will be at `http://localhost:18115`.
The API will be at `http://localhost:3000/api`.

### Project Structure

```
artifacts/
  api-server/               Express backend
    src/
      routes/               auth.ts, products.ts, orders.ts, analytics.ts
      lib/store.ts          In-memory data store with seed data
      middlewares/auth.ts   requireAuth / requireAdmin helpers
      app.ts                Express app setup (CORS, routes)
      index.ts              Server entry point

  mobile/                   Expo React Native app
    app/
      (tabs)/               Home, Shop, Cart, Orders, Profile screens
      auth/                 login.tsx, register.tsx
      admin/                Admin dashboard screens
      product/[id].tsx      Product detail screen
      checkout.tsx          Checkout flow
    context/
      AppContext.tsx         Cart, wishlist, dark mode (global state)
      AuthContext.tsx        Auth state — login, register, logout
    services/api.ts          All API calls to the backend
    constants/colors.ts      Light & dark theme colour tokens

lib/
  db/                       Drizzle ORM schema (ready for PostgreSQL)
  api-zod/                  Zod validation schemas
```

---

## 3. Backend API Reference

### Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:3000/api` |
| Replit (development) | `https://<your-replit-domain>/api` |
| Production VPS | `https://api.yourdomain.com/api` |

### Authentication

Most endpoints require a **Bearer token**. Get a token by logging in or registering.

Send it in every protected request:
```
Authorization: Bearer <your-token-here>
```

---

### Auth Endpoints

#### POST `/api/auth/register`
Create a new account.

**Request body:**
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
    "id": "USR-1234567890-ABCDEF",
    "name": "Ali Hassan",
    "email": "ali@example.com",
    "role": "user",
    "phone": "03001234567",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "a9952e842f772b..."
}
```

---

#### POST `/api/auth/login`
Sign in and receive a session token.

**Request body:**
```json
{
  "email": "ali@example.com",
  "password": "secret123"
}
```

**Response:** Same as register.

---

#### GET `/api/auth/me`
Get the currently signed-in user. **Requires auth.**

**Response:**
```json
{
  "user": {
    "id": "USR-...",
    "name": "Ali Hassan",
    "email": "ali@example.com",
    "role": "user",
    "createdAt": "..."
  }
}
```

---

#### PATCH `/api/auth/profile`
Update name and phone number. **Requires auth.**

**Request body:**
```json
{
  "name": "Ali Hassan",
  "phone": "03009876543"
}
```

**Response:** `{ "user": { ... } }`

---

#### PATCH `/api/auth/password`
Change password. **Requires auth.**

**Request body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**Response:** `{ "success": true }`

---

#### POST `/api/auth/logout`
Invalidate the session token. **Requires auth.**

**Response:** `{ "success": true }`

---

### Product Endpoints

#### GET `/api/products`
List all active products. **Public — no auth needed.**

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `category` | `men` or `women` | Filter by gender |
| `active` | `true` or `false` | Admin: show inactive products |

**Response:**
```json
{
  "products": [
    {
      "id": "p001",
      "name": "Premium Merino Polo",
      "description": "Crafted from finest Merino wool.",
      "category": "men",
      "subcategory": "Polos",
      "originalPrice": 8500,
      "discountedPrice": 5999,
      "costPrice": 3200,
      "images": ["https://cdn.yourdomain.com/polo.jpg"],
      "variants": [
        { "size": "M", "color": "Midnight Black", "stock": 12 }
      ],
      "tags": ["polo", "formal"],
      "isNew": true,
      "isFeatured": true,
      "urgencyText": "Only 3 left in black",
      "viewingCount": 12,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 8
}
```

---

#### GET `/api/products/:id`
Get a single product by ID. **Public.**

**Response:** `{ "product": { ... } }`

---

#### POST `/api/products`
Create a new product. **Admin only.**

**Request body:**
```json
{
  "name": "Silk Blouse",
  "description": "Pure mulberry silk with a delicate drape.",
  "category": "women",
  "subcategory": "Clothing",
  "originalPrice": 11000,
  "discountedPrice": 7500,
  "costPrice": 3800,
  "variants": [
    { "size": "S", "color": "Pearl White", "stock": 8 }
  ],
  "tags": ["blouse", "silk", "formal"],
  "isNew": true,
  "isFeatured": false
}
```

**Response:** `{ "product": { "id": "...", ... } }`

---

#### PUT `/api/products/:id`
Update a product. **Admin only.** Send any fields you want to change.

**Response:** `{ "product": { ... } }`

---

#### DELETE `/api/products/:id`
Soft-delete a product (sets it to inactive, does not remove data). **Admin only.**

**Response:** `{ "success": true }`

---

### Order Endpoints

#### GET `/api/orders`
List orders. **Requires auth.**
- Regular users see only their own orders.
- Admins see all orders.

**Query parameters:**

| Parameter | Values | Description |
|---|---|---|
| `status` | see below | Filter by order status |

**Order statuses:**

| Status | Meaning |
|---|---|
| `pending` | Cash on delivery, awaiting dispatch |
| `awaiting_verification` | Online payment uploaded, waiting for admin to confirm |
| `verified` | Payment confirmed by admin |
| `dispatched` | Shipped, tracking info added |
| `delivered` | Received by customer |
| `cancelled` | Cancelled |

**Response:**
```json
{
  "orders": [
    {
      "id": "ORD-1234567890-ABCDEF",
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
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

#### GET `/api/orders/:id`
Get a single order. **Requires auth.** Users can only access their own orders.

**Response:** `{ "order": { ... } }`

---

#### POST `/api/orders`
Place a new order. **Requires auth.**

**Payment methods:**
- `cod` — Cash on Delivery (status becomes `pending`)
- `jazzcash` — JazzCash (status becomes `awaiting_verification`)
- `easypaid` — Easypaisa (status becomes `awaiting_verification`)

**Request body:**
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

**Response:** `{ "order": { "id": "ORD-...", "status": "pending", ... } }`

---

#### PUT `/api/orders/:id/status`
Update order status. **Admin only.**

**Request body:**
```json
{
  "status": "dispatched",
  "courierName": "TCS",
  "courierTrackingId": "TCS1234567890",
  "notes": "Dispatched via TCS Express"
}
```

**Response:** `{ "order": { ... } }`

---

### Analytics Endpoints (Admin Only)

All analytics endpoints require an admin Bearer token.

#### GET `/api/analytics`
Full dashboard summary.

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

#### GET `/api/analytics/users`
List all registered users.

**Response:** `{ "users": [...], "total": 10 }`

---

#### DELETE `/api/analytics/users/:id`
Delete a user account.

**Response:** `{ "success": true }`

---

#### PATCH `/api/analytics/users/:id/role`
Change a user's role between `user` and `admin`.

**Request body:** `{ "role": "admin" }`

**Response:** `{ "user": { ... } }`

---

### Error Responses

All errors return:
```json
{ "error": "Description of what went wrong" }
```

| HTTP Status | Meaning |
|---|---|
| 400 | Missing or invalid fields |
| 401 | Not authenticated |
| 403 | Not authorised (not admin) |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already taken) |

---

## 4. Database — Switching to PostgreSQL

The current backend uses **in-memory storage**. This means all data (users, products, orders) is lost every time the server restarts. Before going live on a VPS, you must connect a real database.

### Step 1 — Get a PostgreSQL Database

**Option A — Managed (recommended):**
- [Supabase](https://supabase.com) — free tier, easy setup
- [Neon](https://neon.tech) — free tier, serverless PostgreSQL
- [DigitalOcean Managed Databases](https://digitalocean.com) — $15/month

**Option B — Self-hosted on your VPS:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
CREATE USER almera WITH PASSWORD 'yourpassword';
CREATE DATABASE almera_db OWNER almera;
```

### Step 2 — Install Drizzle ORM

The project already has Drizzle set up in `lib/db/`. Install the database driver:

```bash
pnpm --filter @workspace/api-server add pg drizzle-orm
pnpm --filter @workspace/api-server add -D drizzle-kit @types/pg
```

### Step 3 — Set Your Database URL

Add to your environment (`.env` file on VPS, or Replit secrets):
```
DATABASE_URL=postgresql://almera:yourpassword@localhost:5432/almera_db
```

For Supabase/Neon you get the connection string from their dashboard.

### Step 4 — Run Database Migrations

```bash
pnpm --filter @workspace/db push
```

This creates all the tables automatically based on the schema in `lib/db/src/schema/`.

### Step 5 — Update the Backend to Use the Database

Replace the in-memory Maps in `artifacts/api-server/src/lib/store.ts` with Drizzle queries. The schema is already defined in `lib/db/src/schema/index.ts`.

---

## 5. File Storage with Cloudflare R2

R2 is Cloudflare's object storage — it is S3-compatible, has no egress fees, and is significantly cheaper than AWS S3. Use it to store product images, payment proofs, and user uploads.

**Pricing:** ~$0.015/GB stored. Free tier: 10GB/month.

### Step 1 — Create an R2 Bucket

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **R2 Object Storage** in the sidebar
3. Click **Create bucket** → name it `almera-storage`
4. Go to **R2 → Manage R2 API Tokens** → Create token with **Object Read & Write** access
5. Copy your **Account ID**, **Access Key ID**, and **Secret Access Key**

### Step 2 — Enable Public Access (for serving images)

In your bucket settings → enable **Public access** and copy the public URL:
```
https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

Or connect a custom domain like `cdn.yourdomain.com` via Cloudflare DNS.

### Step 3 — Install the AWS SDK

```bash
pnpm --filter @workspace/api-server add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 4 — Add Environment Variables

On your VPS or in Replit secrets:
```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
R2_BUCKET=almera-storage
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

### Step 5 — Create the Upload Endpoint

Create `artifacts/api-server/src/routes/uploads.ts`:

```ts
import { Router } from "express";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { requireAuth } from "../middlewares/auth.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

const router = Router();

// Upload a file (base64 encoded)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { filename, fileBase64, mimeType } = req.body;
    if (!filename || !fileBase64 || !mimeType) {
      res.status(400).json({ error: "filename, fileBase64, and mimeType are required" });
      return;
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    res.json({ url, key });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
```

Then register it in `artifacts/api-server/src/routes/index.ts`:

```ts
import uploadsRouter from "./uploads.js";
router.use("/uploads", uploadsRouter);
```

### Step 6 — Upload Images from Your Website or App

```js
// Convert a file to base64 and upload
async function uploadImage(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          fileBase64: base64,
          mimeType: file.type,
        }),
      });
      const data = await res.json();
      resolve(data.url); // Use this URL as the product image
    };
    reader.readAsDataURL(file);
    reader.onerror = reject;
  });
}
```

---

## 6. Deploying the Backend to a VPS

### Step 1 — Get a VPS

See [Section 15](#15-recommended-vps-providers) for provider recommendations. A $5–6/month plan is enough to start.

During setup choose:
- **Operating System:** Ubuntu 22.04 LTS
- **Region:** Choose the closest to Pakistan (Singapore or Mumbai)

### Step 2 — Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 3 — Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Nginx (web server / reverse proxy)
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager — keeps the server running 24/7)
npm install -g pm2

# Verify installs
node --version    # should show v20.x.x
pnpm --version
nginx -v
```

### Step 4 — Upload Your Code

**Option A — Git (recommended):**
```bash
# On your VPS
git clone https://github.com/yourusername/almera.git /var/www/almera
cd /var/www/almera
```

**Option B — Upload directly:**
```bash
# On your local machine
scp -r ./almera root@your-vps-ip:/var/www/almera
```

### Step 5 — Install Dependencies & Build

```bash
cd /var/www/almera

# Install all workspace dependencies
pnpm install

# Build the API server for production
pnpm --filter @workspace/api-server run build
```

This generates production files in `artifacts/api-server/dist/`.

### Step 6 — Create Environment File

```bash
nano /var/www/almera/.env
```

Add your environment variables:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://almera:password@localhost:5432/almera_db
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
R2_BUCKET=almera-storage
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

### Step 7 — Start with PM2

```bash
cd /var/www/almera

# Start the API server
pm2 start artifacts/api-server/dist/index.js \
  --name almera-api \
  --env production

# Make PM2 restart automatically if the VPS reboots
pm2 save
pm2 startup
# Copy and run the command it prints out
```

**Useful PM2 commands:**
```bash
pm2 list                  # See all running processes
pm2 logs almera-api       # View live logs
pm2 restart almera-api    # Restart the server
pm2 stop almera-api       # Stop the server
pm2 delete almera-api     # Remove the process
```

### Step 8 — Configure Nginx

```bash
nano /etc/nginx/sites-available/almera-api
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Increase upload limit for product images
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:
```bash
ln -s /etc/nginx/sites-available/almera-api /etc/nginx/sites-enabled/
nginx -t               # Test config (should say "ok")
systemctl reload nginx
```

---

## 7. Domain & SSL Setup

### Step 1 — Point Your Domain to the VPS

In your domain registrar's DNS settings, add an **A record**:

| Type | Name | Value |
|---|---|---|
| A | `api` | `your-vps-ip-address` |

For example, if your domain is `yourdomain.com`, this makes `api.yourdomain.com` point to your VPS.

DNS changes take 5 minutes to 24 hours to propagate.

### Step 2 — Get a Free SSL Certificate

```bash
certbot --nginx -d api.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose to redirect HTTP to HTTPS (recommended)

Certbot automatically renews your certificate every 90 days.

**Verify it works:**
```bash
curl https://api.yourdomain.com/api/health
# Should return: {"status":"ok"}
```

---

## 8. CORS — Connecting Your Website

CORS controls which websites can call your API from a browser.

### Current Setting (Allow All — for development)

The API currently accepts requests from any origin. This is fine for development and testing.

### Production Setting (Restrict to Your Domains)

Edit `artifacts/api-server/src/app.ts`:

```ts
import express from "express";
import cors from "cors";
import router from "./routes";

const app = express();

app.use(cors({
  origin: [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://admin.yourdomain.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/api", router);

export default app;
```

Then rebuild and restart:
```bash
pnpm --filter @workspace/api-server run build
pm2 restart almera-api
```

---

## 9. Building the Android APK

### Step 1 — Create a Free Expo Account

Go to [expo.dev](https://expo.dev) and sign up for free.

### Step 2 — Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 3 — Log In

```bash
eas login
```

Enter your Expo account email and password.

### Step 4 — Update Your API URL

Before building, update the app to point to your production backend.

Edit `artifacts/mobile/services/api.ts`:
```ts
const getDomain = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return "api.yourdomain.com"; // Your VPS domain
  return domain;
};
```

Or set it in `artifacts/mobile/.env`:
```
EXPO_PUBLIC_DOMAIN=api.yourdomain.com
```

### Step 5 — Update app.json

Edit `artifacts/mobile/app.json` and add your Android package name:

```json
{
  "expo": {
    "name": "Almera",
    "slug": "almera",
    "version": "1.0.0",
    "android": {
      "package": "pk.almera.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "ios": {
      "bundleIdentifier": "pk.almera.app",
      "supportsTablet": false
    }
  }
}
```

The package name `pk.almera.app` must be unique on the Play Store. Use reverse-domain format with your own domain.

### Step 6 — Build the APK (for testing)

```bash
cd artifacts/mobile
eas build --platform android --profile preview
```

This sends your code to Expo's build servers. It takes 5–15 minutes. When done, you get a download link for the `.apk` file.

### Step 7 — Install on an Android Phone

1. Download the `.apk` file on your phone (or transfer via USB/Google Drive)
2. Open the file
3. If prompted, enable **"Install from unknown sources"** in Settings → Security
4. Tap Install

---

## 10. Publishing to Google Play Store

### Requirements

- Google Play Developer Account ($25 one-time fee) at [play.google.com/console](https://play.google.com/console)
- App icon: 1024×1024 PNG, no transparency
- Feature graphic: 1024×500 PNG
- At least 2 phone screenshots
- Privacy Policy URL (required by Google)

### Step 1 — Build the App Bundle

```bash
cd artifacts/mobile
eas build --platform android --profile production
```

This creates an `.aab` file (Android App Bundle), which is what the Play Store requires.

### Step 2 — Create the App in Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **Create app**
3. Fill in: App name (`Almera`), Language, App or Game, Free or Paid
4. Accept the declarations

### Step 3 — Set Up the Store Listing

Under **Grow → Store presence → Main store listing:**
- App name: `Almera`
- Short description (80 chars): `Premium fashion for men & women — shop Almera in Pakistan`
- Full description (4000 chars): Your detailed description
- Category: Shopping
- Upload: Icon, Feature graphic, Screenshots

### Step 4 — Upload the AAB

Under **Release → Production → Create new release:**
1. Upload your `.aab` file
2. Write release notes (what's new in this version)
3. Click **Review release**

### Step 5 — Complete Required Sections

Google requires you to fill in:
- **Content rating** — complete the questionnaire (takes 5 minutes)
- **Target audience** — select 18+ for shopping app
- **Data safety** — declare what data your app collects

### Step 6 — Submit for Review

Click **Submit to production**. First-time reviews take 1–7 days. After approval your app appears on the Play Store worldwide.

---

## 11. Building for iOS

iOS builds require an **Apple Developer Account** ($99/year) at [developer.apple.com](https://developer.apple.com).

You do NOT need a Mac — EAS handles the build in the cloud.

### Step 1 — Set Up Apple Developer Account

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign up and pay the $99/year fee
3. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and create a new app

### Step 2 — Build for iOS

```bash
cd artifacts/mobile
eas build --platform ios --profile production
```

EAS will guide you through setting up your Apple credentials automatically.

### Step 3 — Submit to App Store

```bash
eas submit --platform ios
```

This uploads the build directly to App Store Connect. Then in App Store Connect, complete your store listing and submit for review. Apple reviews take 1–3 days.

---

## 12. Website Integration

You can connect any website to the Almera backend — HTML/CSS, React, Vue, WordPress, or anything else.

### Quick Start — Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head><title>Almera Shop</title></head>
<body>
  <div id="products"></div>

  <script>
    const API_BASE = "https://api.yourdomain.com/api";
    let token = localStorage.getItem("almera_token");

    // Auth helper
    async function api(path, options = {}) {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }
      return res.json();
    }

    // Login
    async function login(email, password) {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      token = data.token;
      localStorage.setItem("almera_token", token);
      return data.user;
    }

    // Load products
    async function loadProducts() {
      const { products } = await api("/products");
      document.getElementById("products").innerHTML = products
        .map(p => `
          <div>
            <h2>${p.name}</h2>
            <p>PKR ${p.discountedPrice.toLocaleString()}</p>
            <p>${p.description}</p>
          </div>
        `).join("");
    }

    // Place an order
    async function placeOrder(cartItems, address) {
      const subtotal = cartItems.reduce((s, i) => s + i.productPrice * i.quantity, 0);
      const shippingCost = 200;
      return api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems,
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          paymentMethod: "cod",
          address,
        }),
      });
    }

    loadProducts();
  </script>
</body>
</html>
```

### React / Next.js

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.yourdomain.com/api";

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("almera_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// Usage
const { products } = await apiCall<{ products: Product[] }>("/products");
const { user, token } = await apiCall<{ user: User; token: string }>("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
```

---

## 13. Environment Variables Reference

### Backend (VPS / `.env` file)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port the API server listens on (e.g. `3000`) |
| `NODE_ENV` | Yes | Set to `production` on VPS |
| `DATABASE_URL` | When using PostgreSQL | Full PostgreSQL connection string |
| `R2_ACCOUNT_ID` | When using R2 | Cloudflare Account ID |
| `R2_ACCESS_KEY` | When using R2 | R2 Access Key ID |
| `R2_SECRET_KEY` | When using R2 | R2 Secret Access Key |
| `R2_BUCKET` | When using R2 | R2 bucket name (e.g. `almera-storage`) |
| `R2_PUBLIC_URL` | When using R2 | Public URL for serving files |

### Mobile App (build-time)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_DOMAIN` | Your backend domain (e.g. `api.yourdomain.com`) |
| `EXPO_PUBLIC_REPL_ID` | Replit ID (only needed on Replit) |

Set these in `artifacts/mobile/.env` before building the APK.

---

## 14. Production Checklist

Go through this before launching:

### Backend
- [ ] PostgreSQL database is set up and connected
- [ ] `DATABASE_URL` environment variable is set
- [ ] Admin password changed from `admin123` (in `artifacts/api-server/src/lib/store.ts` seed function)
- [ ] CORS restricted to your website/app domains only
- [ ] Server running via PM2 with auto-restart enabled
- [ ] SSL certificate installed (`https://`)
- [ ] `/api/health` returns `{"status":"ok"}`

### File Storage
- [ ] Cloudflare R2 bucket created
- [ ] R2 environment variables set
- [ ] Upload endpoint tested and working
- [ ] Product images uploading and serving correctly

### Mobile App
- [ ] `EXPO_PUBLIC_DOMAIN` points to your VPS domain (`api.yourdomain.com`)
- [ ] APK/AAB built with production API URL
- [ ] App tested on a real Android device
- [ ] App icon and splash screen are correct

### Play Store
- [ ] Google Play Developer account created
- [ ] Store listing complete (description, screenshots, icon)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] App submitted for review

---

## 15. Recommended VPS Providers

| Provider | Price | Notes |
|---|---|---|
| [Hetzner](https://hetzner.com) | From €4/month | Best value, excellent performance |
| [DigitalOcean](https://digitalocean.com) | From $6/month | Easy to use, good docs |
| [Vultr](https://vultr.com) | From $3.50/month | Many server locations |
| [Linode / Akamai](https://linode.com) | From $5/month | Reliable, good support |

**Recommended for Pakistan traffic:** Choose a **Singapore** or **Mumbai** datacenter for the lowest latency.

**What you need at minimum:**
- 1 vCPU
- 1GB RAM
- 25GB SSD
- Ubuntu 22.04 LTS

This is enough to handle several thousand daily orders comfortably.

---

*Guide version: March 2026 — Almera v1.0*
