# Almera App — Integration & Build Guide

## 1. Connecting Your App to Your Website

Your app's backend is already running at: `https://<REPLIT_DEV_DOMAIN>/api-server/api`

### Option A — Use the Same Backend for Both App and Website
Your website (if HTML/JS) can call the same API:

```js
const BASE = "https://<your-replit-domain>/api-server/api";

// Fetch all active products
const res = await fetch(`${BASE}/products`);
const { products } = await res.json();

// Login a user
const loginRes = await fetch(`${BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com", password: "pass123" }),
});
const { user, token } = await loginRes.json();
```

### Available API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | — | Create account |
| POST | /auth/login | — | Sign in |
| GET | /auth/me | Bearer | Get current user |
| PATCH | /auth/profile | Bearer | Update name/phone |
| PATCH | /auth/password | Bearer | Change password |
| POST | /auth/logout | Bearer | Sign out |
| GET | /products | — | List all products |
| GET | /products/:id | — | Get single product |
| POST | /products | Admin | Create product |
| PUT | /products/:id | Admin | Update product |
| DELETE | /products/:id | Admin | Delete product |
| GET | /orders | Bearer | My orders |
| POST | /orders | Bearer | Place an order |
| PUT | /orders/:id/status | Admin | Update order status |
| GET | /analytics | Admin | Dashboard stats |
| GET | /analytics/users | Admin | All users |

### Option B — Connect to an Existing Hosted Backend
If you want to connect the app to your own hosted server (e.g. a WordPress REST API or a custom Node.js API), update the base URL in:

**`artifacts/mobile/services/api.ts`** — change `getApiBase()`:

```ts
export const getApiBase = () => `https://your-website.com/api`;
```

Then update each endpoint path to match your website's API structure.

### CORS Setup (Required for Website Integration)
Your website must be able to call the API. The backend already allows all origins in development. For production, update `artifacts/api-server/src/index.ts`:

```ts
app.use(cors({
  origin: ["https://your-website.com", "https://your-app.com"],
  credentials: true,
}));
```

---

## 2. Switching to a Real Database

The current backend uses **in-memory storage** — all data resets when the server restarts. To persist data, follow these steps:

### Add PostgreSQL (Recommended)
1. In Replit, click the Database icon in the sidebar → Create a PostgreSQL database
2. Install Drizzle ORM: `pnpm add drizzle-orm pg && pnpm add -D drizzle-kit`
3. Replace the Maps in `artifacts/api-server/src/lib/store.ts` with Drizzle queries
4. Your data will now persist permanently

---

## 3. Building an APK for Android

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure Your App
Edit `artifacts/mobile/app.json`:
```json
{
  "expo": {
    "name": "Almera",
    "slug": "almera",
    "version": "1.0.0",
    "android": {
      "package": "pk.almera.app",
      "versionCode": 1
    }
  }
}
```

### Step 3: Initialize EAS
```bash
cd artifacts/mobile
eas build:configure
```

This creates `eas.json`. Use these profiles:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 4: Build a Preview APK (for testing)
```bash
eas build --platform android --profile preview
```
This gives you a downloadable `.apk` you can install directly on any Android phone.

### Step 5: Build for Play Store
```bash
eas build --platform android --profile production
```
This creates an `.aab` (Android App Bundle) for the Play Store.

---

## 4. Publishing to Google Play Store

### Requirements
- A **Google Play Developer account** ($25 one-time fee at play.google.com/console)
- App icons (1024×1024 PNG, no transparency)
- Feature graphic (1024×500 PNG)
- At least 2 screenshots (phone screenshots, minimum 320px wide)
- Privacy Policy URL

### Steps
1. Log in to **Google Play Console** → Create Application
2. Fill in: Title, Short description, Full description, Category (Shopping)
3. Upload: Icon, Feature graphic, Screenshots
4. Upload your `.aab` file under **Release → Production → Create new release**
5. Fill in the release notes
6. Answer the content rating questionnaire
7. Set pricing (free or paid)
8. Submit for review (takes 1–3 days for new accounts)

---

## 5. Building for iOS (iPhone)

You need a **Mac** or **Apple Developer account** ($99/year at developer.apple.com).

### Using EAS Build (No Mac Needed)
```bash
eas build --platform ios --profile production
```

### Requirements
- Apple Developer Program membership
- App Store Connect account
- App icons for all required sizes (use `expo-image` asset generator)

### Submission
```bash
eas submit --platform ios
```

---

## 6. Admin Credentials

- **Email:** admin@almera.pk
- **Password:** admin123

Change this in `artifacts/api-server/src/lib/store.ts` in the `seed()` function before going live.

---

## 7. Environment Variables for Production

When deploying, set these in your environment:

| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (default: 3000) |
| `NODE_ENV` | Set to `production` |
| `JWT_SECRET` | (Add if switching to JWT auth) |

For the mobile app:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_DOMAIN` | Your deployed backend domain |
| `EXPO_PUBLIC_REPL_ID` | Your Replit ID |
