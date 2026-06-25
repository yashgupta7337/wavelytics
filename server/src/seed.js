// One-off seed: initialise the database and write a first snapshot.
// Usage: DATABASE_URL=... npm run seed
import { seedData } from "./feed.js";
import { db } from "./db.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — nothing to seed.");
  process.exit(1);
}

await db.init();
await db.persist(seedData());
await db.close();
console.log("[seed] database initialised with an initial snapshot.");
