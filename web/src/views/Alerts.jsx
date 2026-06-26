import { Card, Badge } from "../components/ui.jsx";

const API = import.meta.env.VITE_API_URL ?? "";
const SEV = { red: "high", amber: "med", green: "good" };
const ORDER = { red: 0, amber: 1, green: 2 };

export default function Alerts({ alerts, token }) {
  const { results = [], summary = {}, events = [] } = alerts || {};
  const breaches = results
    .filter((r) => r.status !== "green")
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  async function downloadCsv() {
    const res = await fetch(`${API}/api/audit-export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Unique filename per download.
    const uuid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    a.download = `${uuid}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const overall = summary.overall || "healthy";
  const overallSev = overall === "critical" ? "high" : overall === "attention" ? "med" : "good";

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge sev={overallSev}>{overall.toUpperCase()}</Badge>
          <span className="text-sm text-muted">
            <span className="font-semibold text-emerald-400">{summary.green || 0}</span> ok ·{" "}
            <span className="font-semibold text-amber-400">{summary.amber || 0}</span> warning ·{" "}
            <span className="font-semibold text-rose-400">{summary.red || 0}</span> critical
          </span>
        </div>
        {token ? (
          <div className="flex gap-2">
            <button
              onClick={downloadCsv}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-sky-500 hover:text-sky-300"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-sky-500 hover:text-sky-300"
            >
              Print / Save as PDF
            </button>
          </div>
        ) : (
          <span className="text-xs text-faint">Sign in to export an audit report.</span>
        )}
      </div>

      <Card title="Active alerts" subtitle="Metrics currently breaching their thresholds"
        className="lg:flex lg:max-h-[40%] lg:min-h-0 lg:flex-col">
        {breaches.length === 0 ? (
          <p className="text-sm text-muted">All metrics are within their thresholds.</p>
        ) : (
          <ul className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {breaches.map((r) => (
              <li
                key={r.metric_key}
                className="flex items-start justify-between gap-3 rounded-lg bg-surface-2/50 px-3 py-2"
              >
                <span className="text-sm text-ink">{r.message}</span>
                <Badge sev={SEV[r.status]}>{r.status.toUpperCase()}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Alert history" subtitle="Recorded breaches from CSV uploads (audit trail)"
        className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        {events.length === 0 ? (
          <p className="text-sm text-muted">
            No recorded breaches yet. Uploads that cross a threshold are logged here.
          </p>
        ) : (
          <div className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Metric</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((e, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap py-2 pr-3 text-xs text-muted">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 text-muted">{e.label}</td>
                    <td className="py-2 pr-3">
                      <Badge sev={SEV[e.status]}>{e.status.toUpperCase()}</Badge>
                    </td>
                    <td className="py-2 text-muted">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
