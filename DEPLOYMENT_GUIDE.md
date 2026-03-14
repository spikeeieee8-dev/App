# Almera — Full Server Deployment Guide

This guide walks you through deploying the Almera app from scratch on your own VPS (Ubuntu 22.04 recommended). It covers every piece: server setup, PostgreSQL, Cloudflare R2 storage, Google OAuth, the backend API, the Expo mobile build, and connecting everything through Cloudflare.

---

## Table of Contents

1. [What You Need](#1-what-you-need)
2. [VPS Server Setup](#2-vps-server-setup)
3. [Install Node.js and pnpm](#3-install-nodejs-and-pnpm)
4. [Set Up PostgreSQL](#4-set-up-postgresql)
5. [Set Up Cloudflare R2 (Image & Video Storage)](#5-set-up-cloudflare-r2-image--video-storage)
6. [Set Up Google OAuth](#6-set-up-google-oauth)
7. [Clone and Build the Project](#7-clone-and-build-the-project)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Run Database Migrations](#9-run-database-migrations)
10. [Run the Backend API with PM2](#10-run-the-backend-api-with-pm2)
11. [Set Up Nginx as a Reverse Proxy](#11-set-up-nginx-as-a-reverse-proxy)
12. [Connect a Domain with Cloudflare DNS](#12-connect-a-domain-with-cloudflare-dns)
13. [Enable HTTPS with Let's Encrypt](#13-enable-https-with-lets-encrypt)
14. [Build and Deploy the Expo Mobile App](#14-build-and-deploy-the-expo-mobile-app)
15. [Admin First Login](#15-admin-first-login)
16. [Maintenance & Updates](#16-maintenance--updates)

---

## 1. What You Need

Before you start, make sure you have:

| Item | Where to get it |
|------|----------------|
| A VPS (Ubuntu 22.04, minimum 1 GB RAM) | DigitalOcean, Hetzner, Linode, AWS EC2, Vultr |
| A domain name | Namecheap, GoDaddy, Cloudflare Registrar |
| A Cloudflare account (free) | cloudflare.com |
| A Google Cloud account (free tier) | console.cloud.google.com |
| Git access to your project | GitHub or any Git host |

---

## 2. VPS Server Setup

### Connect to your server

```bash
ssh root@YOUR_SERVER_IP
```

### Update packages and create a non-root user

```bash
apt update && apt upgrade -y

# Create a deploy user
adduser deploy
usermod -aG sudo deploy

# Copy SSH keys to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### Switch to the deploy user for everything below

```bash
su - deploy
```

### Install essential tools

```bash
sudo apt install -y git curl wget unzip build-essential nginx certbot python3-certbot-nginx ufw
```

### Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 3. Install Node.js and pnpm

```bash
# Install Node.js 22 via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version   # should print v22.x.x

# Install pnpm
npm install -g pnpm pm2
```

---

## 4. Set Up PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

Inside the PostgreSQL prompt:

```sql
CREATE USER almera WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE almera_db OWNER almera;
GRANT ALL PRIVILEGES ON DATABASE almera_db TO almera;
\q
```

Your `DATABASE_URL` will be:
```
postgresql://almera:your_strong_password_here@localhost:5432/almera_db
```

---

## 5. Set Up Cloudflare R2 (Image & Video Storage)

R2 is Cloudflare's S3-compatible object storage — it has a generous free tier and no egress fees.

### Create an R2 Bucket

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **R2 Object Storage** in the left sidebar
3. Click **Create bucket**
4. Name it `almera-media` (or any name you want)
5. Choose a region (Auto is fine)
6. Click **Create bucket**

### Allow public access (so product images load in the app)

1. Open your bucket → **Settings** tab
2. Under **Public access**, click **Allow Access**
3. Note the **Public URL** shown — it looks like:
   `https://pub-XXXXXXXXXXXX.r2.dev`

### Create API credentials

1. Go to **R2 Object Storage** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Give it a name like `almera-api`
4. Permissions: **Object Read & Write** for your specific bucket
5. Click **Create API Token**
6. **Save the Access Key ID and Secret Access Key** — you won't see the secret again

### Find your R2 Endpoint

Your endpoint is:
```
https://ACCOUNT_ID.r2.cloudflarestorage.com
```

Find your Account ID at the top of your Cloudflare dashboard (right sidebar).

---

## 6. Set Up Google OAuth

Skip this step if you don't want Google login. The app works fine with email/password only.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g., "Almera")
3. Go to **APIs & Services** → **OAuth consent screen**
   - User type: External
   - App name: Almera
   - Add your domain to **Authorized domains**
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://api.yourdomain.com`
   - Authorized redirect URIs: `https://api.yourdomain.com/api/auth/google/callback`
5. Click **Create** and copy your **Client ID** and **Client Secret**

---

## 7. Clone and Build the Project

```bash
# Clone your repository
cd /home/deploy
git clone https://github.com/YOUR_USERNAME/almera-app.git
cd almera-app

# Install all dependencies
pnpm install

# Build the backend API
pnpm --filter @workspace/api-server run build
```

---

## 8. Configure Environment Variables

### Backend API environment file

Create `/home/deploy/almera-app/artifacts/api-server/.env`:

```env
# Database
DATABASE_URL=postgresql://almera:your_strong_password_here@localhost:5432/almera_db

# JWT Secret — generate a secure random string
JWT_SECRET=replace_with_at_least_64_random_characters_here

# Server
PORT=8080
NODE_ENV=production

# CORS — your mobile app domain / Cloudflare pages URL
ALLOWED_ORIGINS=https://app.yourdomain.com,https://yourdomain.com

# Cloudflare R2 Storage
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=almera-media
R2_PUBLIC_URL=https://pub-XXXXXXXXXXXX.r2.dev

# Google OAuth (optional — leave blank if not using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Mobile app environment file

Create `/home/deploy/almera-app/artifacts/mobile/.env`:

```env
EXPO_PUBLIC_DOMAIN=api.yourdomain.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your_google_client_id   # optional
```

---

## 9. Run Database Migrations

```bash
cd /home/deploy/almera-app

# Push schema to the database (creates all tables)
pnpm --filter @workspace/db push

# Seed the admin user
pnpm --filter @workspace/api-server run seed
```

This creates all tables and seeds your admin account:
- **Email:** spikee@almerafashion.store
- **Password:** asadtanoli0/

> **Change the password immediately after first login** via the admin profile settings.

---

## 10. Run the Backend API with PM2

PM2 keeps your server running and restarts it automatically on crashes or reboots.

```bash
cd /home/deploy/almera-app/artifacts/api-server

# Start the server with PM2
pm2 start dist/index.js --name "almera-api" --env production

# Save the process list so it restarts on reboot
pm2 save
pm2 startup  # Follow the printed command to enable auto-start
```

### Verify the server is running

```bash
pm2 status
curl http://localhost:8080/api/health
# Should return: {"status":"ok"}
```

---

## 11. Set Up Nginx as a Reverse Proxy

Nginx sits in front of your backend and handles HTTPS.

### Create an Nginx site config

```bash
sudo nano /etc/nginx/sites-available/almera-api
```

Paste this config:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Maximum upload size (for product images/videos)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }
}
```

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/almera-api /etc/nginx/sites-enabled/
sudo nginx -t     # Test config — must say "syntax is ok"
sudo systemctl reload nginx
```

---

## 12. Connect a Domain with Cloudflare DNS

### Add your domain to Cloudflare

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Add a site** → enter your domain (e.g., `yourdomain.com`)
3. Choose the **Free plan**
4. Cloudflare will show you two nameservers (e.g., `ada.ns.cloudflare.com`)
5. Go to your domain registrar and **replace** your nameservers with Cloudflare's

### Add DNS records

In Cloudflare, go to **DNS** → **Records** → **Add record**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | api | YOUR_SERVER_IP | ✅ Proxied |
| A | @ | YOUR_SERVER_IP | ✅ Proxied |
| A | www | YOUR_SERVER_IP | ✅ Proxied |

> With Cloudflare proxy (orange cloud), Cloudflare handles DDoS protection and caching automatically.

### Cloudflare SSL/TLS setting

In Cloudflare → **SSL/TLS** → **Overview**, set the mode to **Full (strict)**.

---

## 13. Enable HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d api.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

Certbot will automatically update your Nginx config. Verify:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Now test: `https://api.yourdomain.com/api/health` should return `{"status":"ok"}`.

### Auto-renewal

Certbot sets up auto-renewal automatically. Test it with:

```bash
sudo certbot renew --dry-run
```

---

## 14. Build and Deploy the Expo Mobile App

You have two options depending on how users will access the app:

---

### Option A: Publish as a Web App (Cloudflare Pages)

This lets users open the app in any browser.

```bash
cd /home/deploy/almera-app

# Build the Expo web bundle
pnpm --filter @workspace/mobile run export
```

This creates a `dist/` folder inside `artifacts/mobile/`.

**Deploy to Cloudflare Pages:**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Connect your GitHub repository
3. Set the build configuration:
   - **Build command:** `cd artifacts/mobile && npx expo export --platform web`
   - **Build output directory:** `artifacts/mobile/dist`
4. Add environment variables:
   - `EXPO_PUBLIC_DOMAIN` = `api.yourdomain.com`
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` = your Google Client ID (if using)
5. Click **Save and Deploy**

Cloudflare Pages gives you a free URL like `almera.pages.dev`, or you can add your own domain.

---

### Option B: Build Native APK for Android

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account (create one at expo.dev)
eas login

cd /home/deploy/almera-app/artifacts/mobile

# Configure EAS build
eas build:configure

# Build an APK (for direct install, no Play Store needed)
eas build -p android --profile preview
```

When the build completes, you'll get a download link for the `.apk` file. Share this link with your customers or upload it to the Play Store.

**To build for iOS:** You need a Mac and an Apple Developer account ($99/year). Contact Expo's documentation for iOS build instructions.

---

## 15. Admin First Login

1. Open the app (web or mobile)
2. Go to the **Login** screen
3. Tap **"Are you an admin?"** or navigate to `/admin/login`
4. Use these credentials:
   - **Email:** spikee@almerafashion.store
   - **Password:** asadtanoli0/

**Immediately after logging in:**
- Go to your profile and change the password
- Go to **Admin → Payments** to set your Easypaisa phone number and upload your QR code

---

## 16. Maintenance & Updates

### Deploy an update

```bash
cd /home/deploy/almera-app

# Pull the latest code
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild the backend
pnpm --filter @workspace/api-server run build

# Run any new DB migrations
pnpm --filter @workspace/db push

# Restart the server
pm2 restart almera-api
```

### View server logs

```bash
pm2 logs almera-api         # Live logs
pm2 logs almera-api --lines 100   # Last 100 lines
```

### Monitor server health

```bash
pm2 monit    # Real-time CPU and memory monitor
```

### Database backup

```bash
# Create a backup
pg_dump -U almera almera_db > backup_$(date +%Y%m%d).sql

# Restore a backup
psql -U almera almera_db < backup_20260101.sql
```

### Automatic daily backups (recommended)

```bash
# Create a backup script
nano /home/deploy/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
mkdir -p $BACKUP_DIR
pg_dump -U almera almera_db > "$BACKUP_DIR/almera_$(date +%Y%m%d_%H%M%S).sql"
# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/deploy/backup.sh

# Schedule daily at 2 AM
crontab -e
# Add this line:
0 2 * * * /home/deploy/backup.sh
```

---

## Quick Reference: Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing auth tokens (64+ random chars) |
| `PORT` | ✅ | Backend port (use 8080) |
| `NODE_ENV` | ✅ | Set to `production` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated list of allowed frontend domains |
| `R2_ENDPOINT` | For uploads | Your Cloudflare R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | For uploads | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | For uploads | R2 API secret key |
| `R2_BUCKET` | For uploads | R2 bucket name |
| `R2_PUBLIC_URL` | For uploads | Public URL for serving uploaded files |
| `GOOGLE_CLIENT_ID` | For Google login | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google login | Google OAuth client secret |

---

## Troubleshooting

**App shows "connection refused" or "network error"**
- Check PM2 is running: `pm2 status`
- Check Nginx: `sudo systemctl status nginx`
- Check firewall: `sudo ufw status`

**Images not uploading**
- Verify R2 credentials in your `.env` file
- Check the bucket name matches exactly
- Make sure the API can reach R2: `curl https://YOUR_R2_ENDPOINT`

**Database connection failed**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify the `DATABASE_URL` in `.env` is correct
- Test manually: `psql postgresql://almera:password@localhost:5432/almera_db`

**SSL certificate issues**
- Make sure your DNS is pointing to the server (not Cloudflare proxy) when running Certbot
- Temporarily set Cloudflare DNS records to **DNS only** (grey cloud), run Certbot, then re-enable proxy

---

*Last updated: March 2026*
