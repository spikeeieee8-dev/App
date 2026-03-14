# Almera — Premium Fashion App (Pakistan)

## Overview

Full-stack mobile e-commerce app built as a TypeScript pnpm monorepo.
- **Backend**: Express 5 API server with in-memory store (no DB reset required for demo)
- **Frontend**: Expo React Native app (iOS + Android)

## Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Express 5, TypeScript, tsx (dev), in-memory store
- **Mobile**: Expo SDK 52, React Native, Expo Router, React Query, @tanstack/react-query
- **Fonts**: Inter (400/500/600/700 via @expo-google-fonts)
- **Icons**: @expo/vector-icons (Feather)
- **Auth**: Session token stored in AsyncStorage, SHA-256 password hashing

## Structure

```
artifacts/
  api-server/         Express API server (port 3000 in Start Backend workflow)
    src/
      routes/         auth.ts, products.ts, orders.ts, analytics.ts
      lib/store.ts    In-memory data store with seed data
      middlewares/    auth.ts (requireAuth / requireAdmin)
  mobile/             Expo React Native app
    app/
      (tabs)/         Home, Shop, Cart, Orders, Profile
      auth/           login.tsx, register.tsx
      account/        edit.tsx (profile editing + password change)
      admin/          index.tsx, login.tsx, orders.tsx, products.tsx, users.tsx
      product/[id]    Product detail screen
      checkout.tsx    Checkout flow
    context/
      AppContext.tsx   Global cart, wishlist, orders, dark mode toggle
      AuthContext.tsx  Auth state, login/register/logout/updateProfile/changePassword
    services/
      api.ts          All API calls to backend
    constants/
      colors.ts       Light (white) + dark theme tokens + brand colors
```

## Theme System

- **Default**: Pure white light theme (`#FFFFFF` background)
- **Dark**: Activates when `isDarkMode` toggle is ON **or** system preference is dark
- `isDarkMode` is persisted in AsyncStorage, starts as `false` (light mode)
- Each screen uses: `const isDark = isDarkMode || colorScheme === "dark";`

## Auth System

- `POST /auth/register` — create account
- `POST /auth/login` — get session token
- `GET /auth/me` — verify token + get user
- `PATCH /auth/profile` — update name/phone (requires auth)
- `PATCH /auth/password` — change password (requires auth)
- **Admin credentials**: admin@almera.pk / admin123

## Admin Panel

Access: Profile tab → Admin Dashboard (visible only when logged in as admin role)
- Admin login: `/admin/login` (dedicated screen)
- Dashboard: `/admin/index` (analytics, charts, revenue)
- Orders management: `/admin/orders`
- Products inventory: `/admin/products`
- Users management: `/admin/users`

## Workflows

- **Start Backend**: `PORT=3000 pnpm --filter @workspace/api-server run dev`
- **Start application**: Expo dev server on port 8080

## Important Files

- `ALMERA_GUIDE.md` — Website integration + APK/Play Store build guide
- `artifacts/mobile/constants/colors.ts` — All theme colors
- `artifacts/api-server/src/lib/store.ts` — In-memory data (change admin password here)

## Known Limitations

- Backend is in-memory: data resets on server restart
- No real payment processing (payments are manually verified)
- Product images: uses URLs, no file upload yet
