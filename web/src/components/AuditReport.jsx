// Print-only audit report. It sits off-screen during normal use and is revealed
// by the @media print rules in index.css when the user prints / saves as PDF.
const STATUS = { red: "CRITICAL", amber: "WARNING", green: "OK" };

export default function AuditReport({ alerts, user }) {
  const { results = [], summary = {}, events = [] } = alerts || {};
  const generated = new Date().toLocaleString();
  const overall = (summary.overall || "healthy").toUpperCase();

  return (
    <div className="audit-report">
      <h1>Wavelytics — Operations &amp; Compliance Audit</h1>
      <p className="audit-meta">
        Generated {generated}
        {user?.email ? ` · ${user.email}` : ""}
      </p>
      <p className="audit-meta">
        Overall: <strong>{overall}</strong> — {summary.green || 0} ok, {summary.amber || 0}{" "}
        warning, {summary.red || 0} critical
      </p>

      <h2>Metric status</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Status</th>
            <th>Threshold</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.metric_key}>
              <td>{r.label}</td>
              <td>{r.value}{r.unit === "%" ? "%" : r.unit ? ` ${r.unit}` : ""}</td>
              <td>{STATUS[r.status] || r.status}</td>
              <td>{r.threshold ?? "—"}</td>
              <td>{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Alert history</h2>
      {events.length === 0 ? (
        <p className="audit-meta">No recorded breaches.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Metric</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td>{new Date(e.created_at).toLocaleString()}</td>
                <td>{e.label}</td>
                <td>{STATUS[e.status] || e.status}</td>
                <td>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="audit-foot">© 2026 Wavelytics · a product by WaveConnect</p>
    </div>
  );
}
