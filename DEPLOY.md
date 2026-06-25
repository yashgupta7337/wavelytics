# Deploying Wavelytics (Vercel + Render + Supabase)

This is the click-by-click runbook for putting the live demo online without AWS:

- **Web** (React/Vite static build) → **Vercel**
- **API** (Express) → **Render**
- **Postgres** (optional, for real persisted data) → **Supabase**

You can ship a public URL in ~15 minutes. There are two paths:

- **Fast path** — deploy Web + API only, no database. The API runs on the
  built-in simulated feed, so you get a working public demo immediately.
- **Full path** — add Supabase Postgres so metrics persist and (later) real
  per-tenant data can be served.

Do the **Fast path** first to get a URL, then add the database when ready.

---

## 0. Prerequisites
- A GitHub account with this repo (`yashgupta7337/wavelytics`).
- Free accounts on [vercel.com](https://vercel.com), [render.com](https://render.com),
  and (for the full path) [supabase.com](https://supabase.com). Sign up with
  "Continue with GitHub" for all three.

---

## 1. Deploy the API to Render

1. Go to **dashboard.render.com → New + → Web Service**.
2. **Connect** the `wavelytics` GitHub repo (authorize Render to read it).
3. Fill in the settings:
   | Field | Value |
   |---|---|
   | **Name** | `wavelytics-api` |
   | **Branch** | `main` (or your deploy branch) |
   | **Root Directory** | *(leave blank — repo root)* |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |
4. **Health Check Path** (Advanced): `/api/health`
5. Leave env vars empty for now (Fast path). Click **Create Web Service**.
6. Wait for the deploy to go green, then open the service URL and visit
   `https://wavelytics-api.onrender.com/api/health`. You should see:
   `{"status":"ok","source":"simulated"}`
7. **Copy the API URL** — you need it in the next step.

> ⚠️ Render's free tier sleeps after ~15 min idle, so the first request after
> idle takes ~30–50s to wake. The web app falls back to its own simulated feed
> while the API is waking, so the dashboard never shows a blank screen.

---

## 2. Deploy the Web app to Vercel

1. Go to **vercel.com/new** and **Import** the `wavelytics` repo.
2. In the project setup, expand **Build & Output Settings** and set:
   | Field | Value |
   |---|---|
   | **Framework Preset** | Vite |
   | **Root Directory** | *(leave as repo root `./`)* |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `web/dist` |
   | **Install Command** | `npm install` |

   *(Root stays at the repo so npm workspaces install correctly; the root
   `build` script compiles the `web` workspace into `web/dist`.)*
3. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | the Render API URL from step 1 (e.g. `https://wavelytics-api.onrender.com`) — **no trailing slash** |
4. Click **Deploy**. When it finishes, open the Vercel URL — the dashboard
   loads and the header shows **LIVE · updated …**.
   - Landing page → `https://<your-app>.vercel.app/`
   - Dashboard console → `https://<your-app>.vercel.app/app/`

---

## 3. Lock down CORS (after you know the Vercel URL)

1. Back in **Render → wavelytics-api → Environment**, add:
   | Key | Value |
   |---|---|
   | `CORS_ORIGIN` | your Vercel URL, e.g. `https://wavelytics.vercel.app` (comma-separate extras) |
2. **Save Changes** → Render redeploys automatically.
3. Reload the Vercel app and confirm data still updates. (If you later add a
   custom domain or want preview deploys to work, add those origins too.)

✅ **At this point you have a public, production-shaped demo.** Stop here for the
Fast path, or continue for real persisted data.

---

## 4. (Full path) Add Supabase Postgres

1. **supabase.com → New project.** Pick a name, a strong DB password (save it),
   and the region closest to your users. Wait for it to provision.
2. **Project Settings → Database → Connection string → URI.** Use the
   **Connection pooling** string (host on port `6543`) — it's friendlier to
   Render's free tier. Replace `[YOUR-PASSWORD]` with the password you set.
3. In **Render → wavelytics-api → Environment**, add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Supabase pooled connection URI |
4. **Save Changes** → Render redeploys. On boot the API creates the
   `metrics_snapshots` table automatically and starts persisting every tick.
5. Verify: `https://wavelytics-api.onrender.com/api/health` should now report
   `{"status":"ok","source":"postgres"}`.

> Seeding is optional — the table is created on startup and fills from the live
> feed. To force an initial snapshot manually, run `npm run seed` with
> `DATABASE_URL` set (Render Shell, or locally).

---

## 5. (Optional) Enable logins + per-tenant CSV uploads

This turns the demo into a sellable pilot: clients sign in and see **their own**
uploaded metrics instead of the simulated feed. It uses the same Supabase project.

1. In **Supabase → Authentication → Providers**, ensure **Email** is enabled.
   For fast pilots, turn **"Confirm email" off** (Authentication → Providers →
   Email) so accounts work immediately; turn it back on for production.
2. Grab two values from **Supabase → Project Settings → API**:
   - **Project URL** and the **anon public** key (for the web app).
   - The **JWT Secret** (for the API to verify tokens).
3. In **Render → wavelytics-api → Environment**, add:
   | Key | Value |
   |---|---|
   | `SUPABASE_JWT_SECRET` | the Supabase **JWT Secret** |
4. In **Vercel → Project → Settings → Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the Supabase **Project URL** |
   | `VITE_SUPABASE_ANON_KEY` | the **anon public** key |
   Then **redeploy** the Vercel project (env vars are build-time for Vite).
5. Open the app → **Sign in** → create an account with a company email. Users
   who share an email domain (e.g. `@acme.com`) share one tenant workspace.
   Click **Upload CSV** (download the template first) to load real metrics.

> Tenancy is by email domain: the first user on a domain provisions the tenant
> and becomes its owner. A signed-in user with no upload yet sees the demo feed
> until their first CSV lands.

---

## Environment variables — quick reference

| Where | Key | Purpose |
|---|---|---|
| Render (API) | `DATABASE_URL` | Postgres connection (full path only) |
| Render (API) | `CORS_ORIGIN` | Allowed web origin(s); comma-separated |
| Render (API) | `SUPABASE_JWT_SECRET` | Verify Supabase logins (enables uploads) |
| Render (API) | `PORT` | Set automatically by Render |
| Vercel (Web) | `VITE_API_URL` | Base URL of the deployed API (build-time) |
| Vercel (Web) | `VITE_SUPABASE_URL` | Supabase project URL (build-time) |
| Vercel (Web) | `VITE_SUPABASE_ANON_KEY` | Supabase anon public key (build-time) |

## Redeploys
- **Web:** every push to the connected branch auto-deploys on Vercel.
- **API:** every push auto-deploys on Render. Changing env vars also redeploys.
