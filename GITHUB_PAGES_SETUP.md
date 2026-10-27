# Outfindly v2.0 — GitHub Pages & Custom Domain Setup (No-CLI Web Guide)

This guide shows you how to host and deploy **Outfindly v2.0** to **GitHub Pages** using your custom domain **`outfindly.app55.site`** entirely through your web browser — **with zero terminal commands or CLI required!**

---

## 🛡️ Why You Won't Get a Black Screen or 404

Single-page React apps on GitHub Pages often run into a blank screen or 404 when refreshed on pages like `/save` or `/creator`. Outfindly has pre-built protections already included:

1. **SPA Redirect Router (`public/404.html`)**: When GitHub Pages hits a deep page, it triggers our custom redirect bridge that routes directly back into the app without showing a broken screen.
2. **Instant URL Restoration (`index.html`)**: When the app opens, an embedded script instantly restores your exact page route with zero flicker.
3. **Automated Domain Mapping (`public/CNAME`)**: Contains `outfindly.app55.site` so GitHub Pages immediately attaches your custom domain on every automated build.
4. **CORS API Fallbacks**: Player lookups and avatar asset loading use automatic browser fallbacks so items, clothes, and 3D previews load reliably on static hosts.

---

## 📋 Step 1: Upload Your Files via GitHub.com (Browser Only)

If you haven't uploaded your project files to GitHub yet, you can do it completely in your web browser:

1. Open [GitHub.com](https://github.com) in your browser and sign in.
2. In the top-right corner, click the **`+`** icon and select **New repository**.
3. Choose a repository name (for example, `outfindly` or `outfindly-v2`).
4. Set it to **Public** (required for free GitHub Pages).
5. Click the green **Create repository** button.
6. On the new repository screen, click the link that says **"uploading an existing file"**.
7. Drag and drop all your project files and folders into the browser window (or click **choose your files**).
   - *Tip:* Make sure the `.github/workflows/deploy.yml`, `public/`, and `src/` folders are included.
8. At the bottom under **Commit changes**, leave "Commit directly to the `main` branch" selected and click the green **Commit changes** button.

---

## 🌐 Step 2: Add the DNS Record for `outfindly.app55.site`

Go to the website where you manage your domain `app55.site` (such as Cloudflare, Namecheap, GoDaddy, Porkbun, or your hosting control panel):

1. Open your domain provider's **DNS Management** page for `app55.site`.
2. Click **Add Record** (or **Create New DNS Record**).
3. Fill in the following:
   - **Type**: `CNAME`
   - **Name / Host / Subdomain**: `outfindly` *(some DNS managers accept `outfindly.app55.site`)*
   - **Target / Value / Points to**: `<your-github-username>.github.io`
     *(Replace `<your-github-username>` with your actual GitHub username, e.g. `john.github.io`)*
   - **TTL**: `Auto` or `1 Hour` (3600 seconds)
   - **Proxy Status**: If you are using Cloudflare, you can set it to **DNS Only** (grey cloud) while setting up, or **Proxied** (orange cloud).
4. Click **Save** or **Save Record**.

*(DNS changes typically take between 2 to 15 minutes to update worldwide).*

---

## ⚙️ Step 3: Enable GitHub Pages in Your Repository Settings

Now configure GitHub Pages using the GitHub web interface:

1. In your web browser, go to your repository on [GitHub.com](https://github.com) (e.g. `https://github.com/<your-username>/outfindly`).
2. Click the **Settings** tab at the top right of your repository.
3. In the left sidebar, look under the **Code and automation** section and click **Pages**.
4. In the main area under **Build and deployment**:
   - Find the **Source** dropdown menu.
   - Click it and select **GitHub Actions** (do NOT choose "Deploy from a branch").
5. Scroll down to the **Custom domain** section:
   - If `outfindly.app55.site` is not already entered, type:
     ```
     outfindly.app55.site
     ```
   - Click the green **Save** button.
   - GitHub will check the DNS records you added in Step 2.
6. Once the domain check succeeds, check the box for **Enforce HTTPS**.
   - *Note:* If the checkbox is temporarily greyed out, GitHub is generating your free SSL security certificate. Refresh the page in 5–10 minutes and check it then.

---

## 🚀 Step 4: Run the Build in the Actions Tab (One-Click)

Your repository already comes with an automated workflow file at `.github/workflows/deploy.yml`. You can deploy directly with a single click in your browser:

1. Click the **Actions** tab at the top of your GitHub repository.
2. In the left sidebar under "Workflows", click **Deploy Outfindly to GitHub Pages**.
3. On the right side, you will see a button labeled **Run workflow**:
   - Click **Run workflow**.
   - Ensure the branch is set to `main` (or `master`).
   - Click the green **Run workflow** button.
4. Within a few seconds, a new workflow run will appear with a yellow spinning circle:
   - GitHub will automatically install packages and build the optimized production files.
   - When finished, the icon turns into a **green checkmark (✓)**.
5. Click on the completed run to view the deployment summary. It will show your live site URL:
   **`https://outfindly.app55.site`**

---

## 🔄 Making Future Updates (No-CLI Web Editing)

Whenever you want to modify code, add avatars, or tweak settings in the future without a terminal:

1. **Direct Web Edit**: Open any file in your repository on GitHub.com and click the **Pencil icon** (Edit this file). Make your changes and click **Commit changes**.
2. **GitHub Web Editor**: Press the `.` (period) key on your keyboard while viewing your repository, or change `github.com` to `github.dev` in your browser URL bar. This opens a full in-browser editor. Make your edits and commit directly from your browser!
3. Every commit pushed to `main` will automatically trigger the Actions build and update `https://outfindly.app55.site` in real time!

---

## 🔍 Verification Checklist

Open **`https://outfindly.app55.site`** in your browser and check:

| Check | Feature | Expected Result |
| :--- | :--- | :--- |
| ✅ | **Home Page** | Loads clean Outfindly v2.0 interface with dark theme and no flash |
| ✅ | **Deep Route Refresh** | Navigating to `https://outfindly.app55.site/save` and pressing reload doesn't show a 404 or black screen |
| ✅ | **Player Search** | Searching a Roblox username or User ID returns avatars, badges, and items |
| ✅ | **Asset Previews** | Player outfits and clothes display rendered Roblox thumbnails |
| ✅ | **SSL / Lock Icon** | Browser address bar shows the secure padlock icon (`https://`) |
