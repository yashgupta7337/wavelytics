# Wavelytics

**Operations & Compliance Intelligence** — a single pane of glass for service
performance, operational health, risk, and compliance.

A WaveConnect company.

This repository is a single monorepo that runs a **real end-to-end stack**
(frontend + API + database) and ships with a built-in **simulated data feed**,
so it works the moment you clone it — no cloud account required.

```
wavelytics/
├── web/      React + Vite dashboard (4 views: Executive, Operational, Risk, Compliance)
├── server/   Express API with a Postgres-or-memory data layer
├── docker-compose.yml   optional local Postgres
└── .env.example
```

## How "real + mock data in one repo" works
- The **API** (`server/`) serves metrics from **Postgres** when `DATABASE_URL`
  is set, and from a **built-in simulated feed** when it isn't.
- The **dashboard** (`web/`) fetches live data from the API, and if the API is
  unreachable it falls back to a local simulated feed so it always renders.

So the architecture is production-shaped from day one; you flip on a real
database (and later, real data sources) without changing the UI.

## Run it locally (zero setup — simulated data)
```bash
npm install          # installs web + server (npm workspaces)
npm run dev          # web on :5173, API on :4000
```
Open http://localhost:5173 — the console polls the live API every 3 seconds.

## Run it with a real database (Postgres)
```bash
docker compose up -d                 # local Postgres (optional)
cp .env.example server/.env          # set DATABASE_URL
npm run seed                         # create tables + first snapshot
npm run dev
```
Check the source: `curl http://localhost:4000/api/health`
→ `{ "status": "ok", "source": "postgres" }`

## API
| Endpoint | Description |
|----------|-------------|
| `GET /api/snapshot` | Current live metrics for all four views. Authenticated → the caller's tenant data; anonymous → the simulated demo feed |
| `GET /api/health`   | Service status, data source (postgres / simulated), and auth mode |
| `GET /api/me`       | Current user and resolved tenant *(auth required)* |
| `GET /api/template.csv` | Sample CSV showing the exact `metric,value` upload format |
| `POST /api/upload`  | Upload a CSV of real metrics for the caller's tenant *(auth required)* |

## Logins, tenants & uploads (optional)
Set `SUPABASE_JWT_SECRET` on the API and `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` on the web build to enable **Supabase Auth**. Signed-in
users see **their own** uploaded metrics instead of the demo feed, with data
isolated per tenant (grouped by email domain). Without these, the app runs as an
open, simulated demo. See [`DEPLOY.md`](./DEPLOY.md) §5.

## Tech stack
- **Frontend:** React 18, Vite, Recharts, Tailwind CSS v4
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (JSONB snapshots)

## Deployment
The frontend is a static build (`npm run build` → `web/dist`) and the API is a
small Node service. See the deployment notes for hosting both without AWS
(Vercel/Netlify + Render/Railway/Fly + Neon/Supabase).
