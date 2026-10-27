# Outfindly v2.0 — GitHub Pages & Custom Domain Setup Guide

Welcome! Your application has been configured for deployment on **GitHub Pages** using your custom domain: **`outfindly.app55.site`**.

---

## 🚀 How We Fixed the "Black Screen" Issue

On single-page apps (SPAs) built with React and Vite, the dreaded **black screen / 404 error** on GitHub Pages happens for two reasons:
1. **Direct Route Refresh (404 Error)**: When you refresh or directly navigate to routes like `/save`, `/creator`, or `/privacy`, GitHub Pages looks for physical folders like `/save/index.html`. Since GitHub Pages is static, it serves its default 404 page (or a blank screen).
2. **Missing CNAME & Domain Asset Mismatches**: When custom domains are configured incorrectly, the browser fails to load JavaScript chunks from `/assets/`.

### What we implemented to guarantee zero black screens:
- **`public/CNAME`**: Contains `outfindly.app55.site`. Vite automatically bundles this into `dist/CNAME` so GitHub Pages instantly recognizes your custom domain.
- **`public/404.html`**: A lightweight SPA router bridge. If a user visits a deep link directly (like `outfindly.app55.site/save`), GitHub Pages serves `404.html`, which immediately redirects to `/?p=save`.
- **`index.html` Route Restoration**: Before React loads, a fast native script restores the real browser URL (`/save`) with `window.history.replaceState()`. React Router mounts the page without refreshing or flashing.
- **CORS API Fallbacks**: Direct Roblox queries use automatic fallback proxies (`corsproxy.io` & `api.allorigins.win`) so avatar search, outfits, and item inspections work on static GitHub Pages.

---

## 🛠 Step 1: Configure Your DNS for `outfindly.app55.site`

In your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy, or your domain registrar):

1. Go to your **DNS Management** for `app55.site`.
2. Add a **CNAME Record**:
   - **Type**: `CNAME`
   - **Name / Host**: `outfindly` (or `outfindly.app55.site` depending on your registrar)
   - **Target / Value**: `<your-github-username>.github.io`
   - **TTL**: Auto or 3600
   - **Proxy status**: If using Cloudflare, you can set "DNS only" during setup or "Proxied".

*(Note: It typically takes 2–15 minutes for new DNS records to propagate globally).*

---

## ⚙️ Step 2: Enable GitHub Pages in Your Repository

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages and outfindly.app55.site"
   git push origin main
   ```
2. On GitHub, open your repository and click on **Settings** (top right tab).
3. On the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**.
5. Under **Custom domain**:
   - You will see `outfindly.app55.site` automatically filled in from the `CNAME` file!
   - If not, type `outfindly.app55.site` and click **Save**.
   - Check the box for **Enforce HTTPS** (GitHub will provision a free SSL certificate automatically).

---

## 🤖 Step 3: Automated Deployment via GitHub Actions

We included an automated workflow at `.github/workflows/deploy.yml`.

Every time you push code to `main` (or click **Run workflow** under the **Actions** tab on GitHub):
1. GitHub spins up a runner with Node.js 20.
2. Runs `npm ci` and `npm run build`.
3. Uploads the `dist/` directory (complete with `CNAME`, `404.html`, and all assets).
4. Deploys live to **`https://outfindly.app55.site`**.

---

## 💻 Manual Deployment Alternative (Optional)

If you prefer to manually build and push to a `gh-pages` branch instead of using GitHub Actions:

1. Build the production files:
   ```bash
   npm run build
   ```
2. The compiled site will be in `/dist` with `dist/CNAME` and `dist/404.html`.
3. You can publish `/dist` to the `gh-pages` branch using the `gh-pages` package:
   ```bash
   npx gh-pages -d dist
   ```

---

## 🔍 Verification Checklist

- [x] **`public/CNAME`** created with `outfindly.app55.site`.
- [x] **`public/404.html`** generated to prevent black screens / 404s on page reloads.
- [x] **`index.html`** updated with SEO, OG, Twitter tags, and SPA URL restoration.
- [x] **`.github/workflows/deploy.yml`** configured for automated deployment.
- [x] **Roblox API client** enhanced with CORS proxy fallbacks for static hosting.
- [x] **Firebase Cross-Device Sync** configured and operational.
