// Live metrics store.
// Holds the current snapshot in memory and advances it on a fixed interval.
// If DATABASE_URL is configured it also persists each tick to Postgres and
// resumes from the last persisted snapshot on startup. Without a database it
// runs entirely on the simulated feed — so the API works with zero setup.
import { seedData, nextData } from "./feed.js";
import { db } from "./db.js";
import { buildTrendFromHistory } from "./csv.js";

const TICK_MS = 3000;

let current = seedData();
let usingDb = false;
let timer;

export async function initStore() {
  if (process.env.DATABASE_URL) {
    try {
      await db.init();
      usingDb = true;
      console.log("[store] Postgres connected — tenant uploads will persist");
    } catch (err) {
      console.warn(
        `[store] Postgres unavailable (${err.message}); using simulated feed`
      );
    }
  } else {
    console.log("[store] No DATABASE_URL — running on simulated feed");
  }

  // The public/demo feed is simulated and ephemeral — advance it in memory only.
  // We deliberately do NOT persist it (it used to write a snapshot every tick,
  // which floods the database for no benefit; it regenerates from seedData on
  // boot). Only tenant CSV uploads are persisted, via saveTenantSnapshot.
  timer = setInterval(() => {
    current = nextData(current);
  }, TICK_MS);
}

// The public/demo snapshot (simulated feed). Served to anonymous callers.
export function getSnapshot() {
  return current;
}

// A tenant's own snapshot from their latest upload. Falls back to the demo
// feed until they've uploaded anything, so a new pilot account is never blank.
export async function getTenantSnapshot(tenantId) {
  if (!usingDb || !tenantId) return current;
  try {
    const latest = await db.loadLatest(tenantId);
    if (!latest) return current;
    // Once the tenant has >= 2 uploads, replace the synthetic per-upload trend
    // with a real series built from their upload history.
    const history = await db.getSnapshotHistory(tenantId, { limit: 12 });
    if (history.length >= 2) {
      return { ...latest, trend: buildTrendFromHistory(history) };
    }
    return latest;
  } catch (err) {
    console.warn("[store] tenant snapshot load failed:", err.message);
    return current;
  }
}

// Persist a tenant's uploaded snapshot and record the upload for the audit log.
export async function saveTenantSnapshot(snapshot, { tenantId, uploadedBy, filename, rowCount }) {
  if (!usingDb) throw new Error("database_required");
  await db.persist(snapshot, tenantId);
  await db.recordUpload({ tenantId, uploadedBy, filename, rowCount });
}

export function isUsingDb() {
  return usingDb;
}

export async function stopStore() {
  clearInterval(timer);
  await db.close().catch(() => {});
}
