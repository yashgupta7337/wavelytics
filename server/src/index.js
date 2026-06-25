// Wavelytics API server.
import express from "express";
import cors from "cors";
import {
  initStore,
  getSnapshot,
  getTenantSnapshot,
  saveTenantSnapshot,
  isUsingDb,
} from "./store.js";
import { db } from "./db.js";
import { optionalAuth, requireAuth, authConfigured } from "./auth.js";
import { parseCsv, buildSnapshot, TEMPLATE_CSV } from "./csv.js";

const app = express();

// CORS: in production set CORS_ORIGIN to the deployed web origin
// (comma-separated for multiple, e.g. a Vercel preview + prod URL).
// Unset => allow all origins, which is fine for local dev and the public demo.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
// Accept raw CSV bodies (and JSON { csv } via express.json above).
app.use(express.text({ type: ["text/csv", "text/plain"], limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    source: isUsingDb() ? "postgres" : "simulated",
    auth: authConfigured() ? "supabase" : "disabled",
  });
});

// Current metrics. Authenticated callers get their tenant's data; anonymous
// callers get the public simulated demo feed.
app.get("/api/snapshot", optionalAuth, async (req, res) => {
  try {
    if (req.user && isUsingDb()) {
      const tenantId = await db.resolveTenant(req.user);
      return res.json(await getTenantSnapshot(tenantId));
    }
  } catch (err) {
    console.warn("[api] tenant snapshot failed:", err.message);
  }
  res.json(getSnapshot());
});

// Who am I + which tenant. Used by the web app after login.
app.get("/api/me", requireAuth, async (req, res) => {
  if (!isUsingDb()) {
    return res.json({ user: req.user, tenant: null, note: "no database configured" });
  }
  try {
    const tenantId = await db.resolveTenant(req.user);
    const tenant = await db.getTenant(tenantId);
    res.json({ user: req.user, tenant });
  } catch (err) {
    console.error("[api] /api/me failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// CSV template so clients know the exact format to upload.
app.get("/api/template.csv", (req, res) => {
  res.type("text/csv").send(TEMPLATE_CSV);
});

// Upload a CSV of real metrics for the caller's tenant.
app.post("/api/upload", requireAuth, async (req, res) => {
  if (!isUsingDb()) {
    return res.status(503).json({
      error: "database_required",
      message: "Set DATABASE_URL on the API to enable uploads.",
    });
  }

  const csvText =
    typeof req.body === "string"
      ? req.body
      : typeof req.body?.csv === "string"
        ? req.body.csv
        : "";
  if (!csvText.trim()) {
    return res.status(400).json({ error: "empty_csv", message: "No CSV content received." });
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return res.status(400).json({ error: "no_rows", message: "Could not parse any metric rows." });
  }

  const { snapshot, applied } = buildSnapshot(rows);
  if (applied === 0) {
    return res.status(400).json({
      error: "no_known_metrics",
      message: "No recognised metric keys found. Download /api/template.csv for the format.",
    });
  }

  try {
    const tenantId = await db.resolveTenant(req.user);
    await saveTenantSnapshot(snapshot, {
      tenantId,
      uploadedBy: req.user.id,
      filename: req.query.filename || "upload.csv",
      rowCount: rows.length,
    });
    res.json({ ok: true, applied, rows: rows.length, snapshot });
  } catch (err) {
    console.error("[api] /api/upload failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

const PORT = process.env.PORT || 4000;

await initStore();
app.listen(PORT, () => {
  console.log(`[wavelytics] API listening on http://localhost:${PORT}`);
});
