# Future feature additions

Tracking deferred work so it's easy to pick up. Each item notes where it hooks
into the current code.

## Alert dispatch: Slack + email (deferred)
The rules engine already evaluates each upload and records breaches as
`alert_events` (the audit trail). The remaining piece is **dispatching** those
breaches to external channels. The single insertion point is the post-upload
evaluation in `server/src/index.js` (the `POST /api/upload` handler), right after
`db.recordAlertEvents(...)`:

```js
const breaches = evaluate(snapshot, rules).filter((r) => r.status !== "green");
if (breaches.length) {
  await db.recordAlertEvents(tenantId, breaches);
  await dispatchAlerts(tenantId, breaches); // <-- add this
}
```

### Slack (incoming webhook) — easiest, do first
- **Config:** one env var `SLACK_WEBHOOK_URL` (per deployment now; per-tenant
  later via a `tenant_settings` table). Render env var; no redeploy of Vercel.
- **Implementation:** a `server/src/notify.js` with `postSlack(webhookUrl, text)`
  that `fetch`es the webhook with a Block Kit / plain `{ text }` payload
  summarizing the red/amber breaches (label, value, threshold).
- **Dedup/rate-limit:** only notify on *new* or *worsened* breaches (compare to
  the previous snapshot's statuses), and coalesce all breaches from one upload
  into a single message.

### Email (transactional provider) — Resend recommended
- **Why a provider:** the deployed API can't use the Gmail MCP (that's a
  Claude-session tool, not available at server runtime), so use a transactional
  email API.
- **Config:** `RESEND_API_KEY` + a verified `ALERTS_FROM` address (Render env).
  Recipients = the tenant's `tenant_members.email` (already stored).
- **Implementation:** `notify.js` `sendEmail({to, subject, html})` calling Resend;
  render a small HTML summary of breaches (reuse the audit-report markup).
- **Dedup/rate-limit:** same "new/worsened only" rule; cap to one email per
  upload; consider a daily digest option later.

### Per-tenant channel settings (later)
Add a `tenant_settings(tenant_id, slack_webhook_url, email_enabled, ...)` table +
a small UI in the existing Rules/settings area so each client configures their own
channels, instead of deployment-wide env vars.

## Branded auth emails via custom SMTP (deferred)
Supabase only allows editing the auth email templates (e.g. the branded
`docs/supabase-confirm-email.html`) when **custom SMTP** is configured; the
built-in sender is locked to the plain default template and rate-limited
(~3–4/hour). To ship the branded confirmation email + higher limits: set up
**Resend** (free tier), verify the `waveconnect.net.in` sending domain via DNS
(SPF/DKIM on a `send.` subdomain so it won't touch the existing `info@` mail),
then point Supabase SMTP at `smtp.resend.com:465` (user `resend`, password = the
Resend API key, sender `noreply@waveconnect.net.in`). No app code changes.

## Other candidates
- **Password reset completion page** — `resetPasswordForEmail` already sends the
  link; add a `/app/` handler for the recovery token to set a new password.
- **Scheduled snapshots / n8n ingestion** — pull live data on a schedule instead
  of manual CSV upload (the CSV→snapshot mapping in `server/src/csv.js` is reused).
- **Chart theming for light mode** — recharts colors are currently fixed; tokenize
  them to follow the theme.
