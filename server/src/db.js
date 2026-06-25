// Postgres data access. Only used when DATABASE_URL is set.
// Stores each metrics snapshot as a JSONB row so the schema can evolve freely.
//
// Multi-tenancy: every snapshot and upload is scoped to a tenant_id. A NULL
// tenant_id is the shared public "demo" stream (the simulated feed). Each pilot
// client is a tenant; users are mapped to a tenant via tenant_members so they
// only ever see their own data.
import pg from "pg";

const { Pool } = pg;
let pool;

export const db = {
  async init() {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug       TEXT UNIQUE NOT NULL,
        name       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS tenant_members (
        user_id    UUID NOT NULL,
        tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email      TEXT,
        role       TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, tenant_id)
      );

      CREATE TABLE IF NOT EXISTS metrics_snapshots (
        id          BIGSERIAL PRIMARY KEY,
        tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        payload     JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metric_uploads (
        id          BIGSERIAL PRIMARY KEY,
        tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        uploaded_by UUID,
        filename    TEXT,
        row_count   INTEGER NOT NULL DEFAULT 0,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_snapshots_tenant
        ON metrics_snapshots (tenant_id, id DESC);
    `);

    // Backfill for databases created before multi-tenancy was added.
    await pool.query(
      `ALTER TABLE metrics_snapshots
         ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`
    );
  },

  // ---- tenants & membership ------------------------------------------------

  // Resolve (or create) the tenant a user belongs to. Pilot onboarding is
  // frictionless: a user is grouped with everyone sharing their email domain,
  // which becomes the tenant. First user in a domain provisions the tenant.
  async resolveTenant({ id: userId, email }) {
    const domain = (email?.split("@")[1] || "client").toLowerCase();
    const slug = domain.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const name = domain.split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase());

    const existing = await pool.query(
      "SELECT tenant_id FROM tenant_members WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    if (existing.rows[0]) return existing.rows[0].tenant_id;

    const tenant = await pool.query(
      `INSERT INTO tenants (slug, name) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
         RETURNING id`,
      [slug, name]
    );
    const tenantId = tenant.rows[0].id;

    // First member of a freshly-created tenant is the owner.
    const count = await pool.query(
      "SELECT COUNT(*)::int AS n FROM tenant_members WHERE tenant_id = $1",
      [tenantId]
    );
    const role = count.rows[0].n === 0 ? "owner" : "member";

    await pool.query(
      `INSERT INTO tenant_members (user_id, tenant_id, email, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, tenant_id) DO NOTHING`,
      [userId, tenantId, email, role]
    );
    return tenantId;
  },

  async getTenant(tenantId) {
    const { rows } = await pool.query(
      "SELECT id, slug, name FROM tenants WHERE id = $1",
      [tenantId]
    );
    return rows[0] ?? null;
  },

  // ---- snapshots -----------------------------------------------------------

  async persist(snapshot, tenantId = null) {
    await pool.query(
      "INSERT INTO metrics_snapshots (tenant_id, payload) VALUES ($1, $2)",
      [tenantId, snapshot]
    );
  },

  async loadLatest(tenantId = null) {
    const { rows } = await pool.query(
      tenantId
        ? "SELECT payload FROM metrics_snapshots WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1"
        : "SELECT payload FROM metrics_snapshots WHERE tenant_id IS NULL ORDER BY id DESC LIMIT 1",
      tenantId ? [tenantId] : []
    );
    return rows[0]?.payload ?? null;
  },

  async recordUpload({ tenantId, uploadedBy, filename, rowCount }) {
    await pool.query(
      `INSERT INTO metric_uploads (tenant_id, uploaded_by, filename, row_count)
         VALUES ($1, $2, $3, $4)`,
      [tenantId, uploadedBy ?? null, filename ?? null, rowCount ?? 0]
    );
  },

  async close() {
    if (pool) await pool.end();
  },
};
