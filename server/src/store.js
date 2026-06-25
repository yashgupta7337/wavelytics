// Live metrics store.
// Holds the current snapshot in memory and advances it on a fixed interval.
// If DATABASE_URL is configured it also persists each tick to Postgres and
// resumes from the last persisted snapshot on startup. Without a database it
// runs entirely on the simulated feed — so the API works with zero setup.
import { seedData, nextData } from "./feed.js";
import { db } from "./db.js";

const TICK_MS = 3000;

let current = seedData();
let usingDb = false;
let timer;

export async function initStore() {
  if (process.env.DATABASE_URL) {
    try {
      await db.init();
      const latest = await db.loadLatest();
      if (latest) current = latest;
      usingDb = true;
      console.log("[store] Postgres connected — persisting live metrics");
    } catch (err) {
      console.warn(
        `[store] Postgres unavailable (${err.message}); using simulated feed`
      );
    }
  } else {
    console.log("[store] No DATABASE_URL — running on simulated feed");
  }

  timer = setInterval(async () => {
    current = nextData(current);
    if (usingDb) {
      try {
        await db.persist(current);
      } catch (err) {
        console.warn("[store] persist failed:", err.message);
      }
    }
  }, TICK_MS);
}

export function getSnapshot() {
  return current;
}

export function isUsingDb() {
  return usingDb;
}

export async function stopStore() {
  clearInterval(timer);
  await db.close().catch(() => {});
}
