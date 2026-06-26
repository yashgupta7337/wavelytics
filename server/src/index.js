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
import {
  evaluate,
  summarize,
  statusByMetric,
  defaultRules,
  METRIC_ACCESSORS,
} from "./rules.js";

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

// The tenant's members (read-only; enrollment is by email domain).
app.get("/api/members", requireAuth, async (req, res) => {
  if (!isUsingDb()) return res.json({ members: [] });
  try {
    const tenantId = await db.resolveTenant(req.user);
    res.json({ members: await db.getTenantMembers(tenantId) });
  } catch (err) {
    console.error("[api] /api/members failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// The tenant's recent CSV uploads (audit of who refreshed the data and when).
app.get("/api/uploads", requireAuth, async (req, res) => {
  if (!isUsingDb()) return res.json({ uploads: [] });
  try {
    const tenantId = await db.resolveTenant(req.user);
    res.json({ uploads: await db.getRecentUploads(tenantId, { limit: 20 }) });
  } catch (err) {
    console.error("[api] /api/uploads failed:", err.message);
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

    // Evaluate the new snapshot against the tenant's rules and record any
    // breaches — this is what builds the audit trail (and where Slack/email
    // dispatch will hook in later; see future-feature-additions.md).
    const rules = await db.getRules(tenantId);
    const breaches = evaluate(snapshot, rules).filter((r) => r.status !== "green");
    if (breaches.length) await db.recordAlertEvents(tenantId, breaches);

    res.json({ ok: true, applied, rows: rows.length, alerts: breaches.length, snapshot });
  } catch (err) {
    console.error("[api] /api/upload failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// ---- Rules engine: thresholds, alerts, audit export -----------------------

// A tenant's threshold rules (seeded defaults until they save their own).
app.get("/api/rules", requireAuth, async (req, res) => {
  if (!isUsingDb()) return res.json({ rules: defaultRules() });
  try {
    const tenantId = await db.resolveTenant(req.user);
    res.json({ rules: await db.getRules(tenantId) });
  } catch (err) {
    console.error("[api] /api/rules GET failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Update a tenant's rules.
app.put("/api/rules", requireAuth, async (req, res) => {
  if (!isUsingDb()) {
    return res.status(503).json({ error: "database_required" });
  }
  const incoming = Array.isArray(req.body) ? req.body : req.body?.rules;
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: "invalid_body", message: "Expected { rules: [...] }." });
  }
  const clean = [];
  for (const r of incoming) {
    if (!METRIC_ACCESSORS[r.metric_key]) continue;
    if (r.comparator !== "above" && r.comparator !== "below") continue;
    const warn = Number(r.warn);
    const crit = Number(r.crit);
    if (Number.isNaN(warn) || Number.isNaN(crit)) continue;
    clean.push({
      metric_key: r.metric_key,
      label: String(r.label || r.metric_key),
      comparator: r.comparator,
      warn,
      crit,
      unit: typeof r.unit === "string" ? r.unit : "",
      enabled: r.enabled !== false,
    });
  }
  if (!clean.length) {
    return res.status(400).json({ error: "no_valid_rules" });
  }
  try {
    const tenantId = await db.resolveTenant(req.user);
    res.json({ rules: await db.saveRules(tenantId, clean) });
  } catch (err) {
    console.error("[api] /api/rules PUT failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Current RAG status for every ruled metric + a summary + recent alert events.
app.get("/api/alerts", optionalAuth, async (req, res) => {
  try {
    let snapshot = getSnapshot();
    let rules = defaultRules();
    let events = [];
    if (req.user && isUsingDb()) {
      const tenantId = await db.resolveTenant(req.user);
      snapshot = await getTenantSnapshot(tenantId);
      rules = await db.getRules(tenantId);
      events = await db.getAlertEvents(tenantId, { limit: 50 });
    }
    const results = evaluate(snapshot, rules);
    res.json({
      results,
      summary: summarize(results),
      statusByMetric: statusByMetric(results),
      events,
      updatedAt: snapshot?.updatedAt,
    });
  } catch (err) {
    console.warn("[api] /api/alerts failed:", err.message);
    const results = evaluate(getSnapshot(), defaultRules());
    res.json({ results, summary: summarize(results), statusByMetric: statusByMetric(results), events: [] });
  }
});

// Audit export: a CSV of the current metric statuses + the breach history.
app.get("/api/audit-export.csv", requireAuth, async (req, res) => {
  if (!isUsingDb()) return res.status(503).json({ error: "database_required" });
  try {
    const tenantId = await db.resolveTenant(req.user);
    const tenant = await db.getTenant(tenantId);
    const snapshot = await getTenantSnapshot(tenantId);
    const rules = await db.getRules(tenantId);
    const results = evaluate(snapshot, rules);
    const events = await db.getAlertEvents(tenantId, { limit: 500 });

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [];
    lines.push(`Wavelytics audit export`);
    lines.push(`Tenant,${esc(tenant?.name || tenantId)}`);
    lines.push(`Generated at,${esc(new Date().toISOString())}`);
    lines.push(`Snapshot at,${esc(snapshot?.updatedAt || "")}`);
    lines.push("");
    lines.push("Metric,Value,Status,Threshold,Message");
    for (const r of results) {
      lines.push(
        [r.label, r.value, r.status, r.threshold ?? "", r.message].map(esc).join(",")
      );
    }
    lines.push("");
    lines.push("Alert history (most recent first)");
    lines.push("When,Metric,Status,Value,Threshold,Message");
    for (const e of events) {
      lines.push(
        [e.created_at, e.label, e.status, e.value, e.threshold ?? "", e.message]
          .map(esc)
          .join(",")
      );
    }

    res
      .type("text/csv")
      .set("Content-Disposition", `attachment; filename="wavelytics-audit.csv"`)
      .send(lines.join("\n"));
  } catch (err) {
    console.error("[api] /api/audit-export.csv failed:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

const PORT = process.env.PORT || 4000;

await initStore();
app.listen(PORT, () => {
  console.log(`[wavelytics] API listening on http://localhost:${PORT}`);
});
