// Postgres data access. Only used when DATABASE_URL is set.
// Stores each metrics snapshot as a JSONB row so the schema can evolve freely.
import pg from "pg";

const { Pool } = pg;
let pool;

export const db = {
  async init() {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metrics_snapshots (
        id          BIGSERIAL PRIMARY KEY,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        payload     JSONB NOT NULL
      );
    `);
  },

  async persist(snapshot) {
    await pool.query(
      "INSERT INTO metrics_snapshots (payload) VALUES ($1)",
      [snapshot]
    );
  },

  async loadLatest() {
    const { rows } = await pool.query(
      "SELECT payload FROM metrics_snapshots ORDER BY id DESC LIMIT 1"
    );
    return rows[0]?.payload ?? null;
  },

  async close() {
    if (pool) await pool.end();
  },
};
