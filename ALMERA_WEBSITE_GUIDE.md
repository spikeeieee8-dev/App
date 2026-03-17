# Almera – Website & App Guide

This guide explains how Almera works: the backend API, the mobile app, admin features, and how to connect Cloudflare R2 for image storage.

---

## Table of Contents

1. [Overview](#overview)
2. [Running Locally](#running-locally)
3. [Admin Panel](#admin-panel)
4. [Product Management](#product-management)
5. [Order Management](#order-management)
6. [Settings & Configuration](#settings--configuration)
7. [Social Links & Legal Pages](#social-links--legal-pages)
8. [Image Storage – Cloudflare R2](#image-storage--cloudflare-r2)
9. [Custom Database](#custom-database)
10. [Deployment](#deployment)

---

## Overview

**Almera** is a full-stack e-commerce mobile app for a premium Pakistani fashion brand.

| Component | Technology |
|-----------|------------|
| Mobile App | Expo / React Native |
| Backend API | Express 5 + TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Image Storage | Local (development) / Cloudflare R2 (production) |

**Admin credentials (default):**
- Email: `admin@almera.pk`
- Password: `admin123`

---

## Running Locally

The project uses `pnpm` workspaces.

**Start the backend API:**
```bash
pnpm --filter @workspace/api-server run dev
```
The API runs on port **8080** and is accessible at `/api/...`

**Start the mobile app:**
```bash
pnpm --filter @workspace/mobile run dev
```

Open Expo Go on your phone and scan the QR code shown in the terminal, or open the web preview in your browser.

---

## Admin Panel

The admin panel is built directly into the mobile app. To access it:

1. Log in with `admin@almera.pk` / `admin123`
2. Tap **Profile** tab → **Admin Dashboard**

The admin panel has these sections:

| Section | What you can do |
|---------|----------------|
| **Products** | Add, edit, delete products with images, sizes, colours, pricing |
| **Orders** | View all orders, update status, view payment proof screenshots |
| **Settings** | Configure Easypaisa, social links, WhatsApp, legal pages, database |

---

## Product Management

### Adding a Product

1. Go to **Admin → Products**
2. Tap **+ Add Product**
3. Fill in:
   - Name, description, category
   - Price (original) and discounted price
   - Sizes (e.g. S, M, L, XL)
   - Colours (enter names — white, black, navy, etc.)
   - Up to 5 product images (uploaded from your gallery)
   - Stock quantity, whether it's featured or on sale
4. Tap **Create Product**

### Editing / Deleting

- Tap any product to edit it
- Swipe left or tap the trash icon to delete it

### Images

In development, images are stored in `artifacts/api-server/uploads/`. In production, configure Cloudflare R2 (see below).

---

## Order Management

Orders are placed by customers through the checkout flow. Admins can:

1. Go to **Admin → Orders**
2. See all orders with status: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
3. Tap an order to view details — including the customer's payment proof screenshot (for Easypaisa orders)
4. Tap **Update Status** to change the order status

### Order Status Flow

```
pending → processing → shipped → delivered
                              ↘ cancelled
```

---

## Settings & Configuration

Go to **Admin → Settings** to configure:

### Easypaisa Payment
- **Account Name** – displayed to customers at checkout
- **Phone Number** – the number they should send money to
- **QR Code** – upload your Easypaisa QR code (customers can scan it)

### Social & Contact
- **WhatsApp Number** – number format: `923001234567` (country code, no + or dashes)
- **Instagram URL** – full URL e.g. `https://instagram.com/almera.pk`
- **Twitter / X URL** – full URL
- **TikTok URL** – full URL

These appear in the **More** tab of the app.

---

## Social Links & Legal Pages

### Social Links

Set in **Admin → Settings → Social & Contact**. All links appear in the **More** tab. If a link is blank, that platform is hidden.

### Legal Pages

Set in **Admin → Settings → Legal Pages**. Three pages are supported:

| Page | Accessed at |
|------|------------|
| Terms of Service | More → Terms of Service |
| Privacy Policy | More → Privacy Policy |
| Refund & Return Policy | More → Refund & Return Policy |

Content is written in **Markdown**:
- `# Heading 1`
- `## Heading 2`
- `- Bullet point`
- `1. Numbered list`
- Regular paragraph text

---

## Image Storage – Cloudflare R2

By default, uploaded images are saved to the server's local disk (`artifacts/api-server/uploads/`). This works fine for development but images are lost when the server restarts in production.

**To use Cloudflare R2 for persistent image storage:**

### Step 1 – Create an R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2 Object Storage** → **Create Bucket**
3. Name it e.g. `almera-uploads`
4. Choose a region close to Pakistan (e.g. APAC)

### Step 2 – Create API Tokens

1. In Cloudflare → **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Set permissions: **Object Read & Write**
4. Scope to your bucket: `almera-uploads`
5. Save the generated:
   - **Access Key ID**
   - **Secret Access Key**

Also note your **Account ID** from the Cloudflare dashboard URL or Overview page.

### Step 3 – Enable Public Access (for image URLs)

1. Go to your R2 bucket → **Settings** → **Public Access**
2. Enable **Allow Public Access**
3. Note the **Public URL** e.g. `https://pub-xxxx.r2.dev`

Or set up a custom domain (recommended):
1. Add a custom domain like `cdn.almera.pk`
2. Point it to your R2 bucket via Cloudflare DNS

### Step 4 – Set Environment Variables

Add these secrets to your Replit project (Settings → Secrets):

| Variable | Value |
|----------|-------|
| `R2_ACCOUNT_ID` | Your Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | The access key from Step 2 |
| `R2_SECRET_ACCESS_KEY` | The secret key from Step 2 |
| `R2_BUCKET_NAME` | e.g. `almera-uploads` |
| `R2_PUBLIC_URL` | e.g. `https://pub-xxxx.r2.dev` or `https://cdn.almera.pk` |

### Step 5 – Update the Upload Route

In `artifacts/api-server/src/routes/upload.ts`, the upload handler needs to use the `@aws-sdk/client-s3` package (R2 is S3-compatible). Here is the integration:

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

const r2 = process.env.R2_ACCOUNT_ID
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

// In the upload handler, after saving locally:
if (r2) {
  const fileBuffer = readFileSync(localFilePath);
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `${folder}/${filename}`,
    Body: fileBuffer,
    ContentType: mimetype,
    ACL: "public-read",
  }));
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${folder}/${filename}`;
  return res.json({ url: publicUrl });
}
```

Install the SDK:
```bash
pnpm add @aws-sdk/client-s3 --filter @workspace/api-server
```

---

## Custom Database

By default, Almera uses the built-in Replit PostgreSQL database. To connect to your own PostgreSQL database:

1. Go to **Admin → Settings → Database Connection**
2. Enter your PostgreSQL connection URL:
   ```
   postgresql://username:password@host:5432/database_name
   ```
3. Tap **Save & Connect**

The server will restart and connect to your database. The schema will be pushed automatically.

**Recommended PostgreSQL providers:**
- [Neon](https://neon.tech) – Free tier, serverless, great for Vercel/cloud deployments
- [Supabase](https://supabase.com) – Free tier, includes auth and storage
- [Railway](https://railway.app) – Easy setup, pay per use
- [Aiven](https://aiven.io) – Free trial, good for Pakistan region

---

## Deployment

### Publishing on Replit

1. Make sure the app is working in development
2. Click the **Deploy** button in Replit
3. Replit will build and host both the API and the mobile web app

### Environment Variables for Production

Set these in Replit Secrets before deploying:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection URL |
| `JWT_SECRET` | A long random string for token security |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID (optional) |
| `R2_ACCESS_KEY_ID` | R2 access key (optional) |
| `R2_SECRET_ACCESS_KEY` | R2 secret key (optional) |
| `R2_BUCKET_NAME` | R2 bucket name (optional) |
| `R2_PUBLIC_URL` | R2 public CDN URL (optional) |

### Generating a Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and set it as `JWT_SECRET`.

---

## API Reference (Summary)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/products` | None | List all products |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/orders` | Admin | List all orders |
| GET | `/api/orders/mine` | User | List own orders |
| POST | `/api/orders` | User | Place an order |
| PUT | `/api/orders/:id/status` | Admin | Update order status |
| GET | `/api/settings/public` | None | Get public settings |
| GET | `/api/settings` | Admin | Get all settings |
| POST | `/api/settings/:key` | Admin | Update a setting |
| POST | `/api/upload` | Admin | Upload a file |
| POST | `/api/upload/proof` | User | Upload payment proof |

---

*Almera – Premium Fashion for Pakistan*
