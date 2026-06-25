import { Card, KpiCard, ProgressBar } from "../components/ui.jsx";

export default function Compliance({ data }) {
  const { compliance: c } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Audit Readiness" value={c.auditReadiness} unit="%"
          tone={c.auditReadiness >= 90 ? "good" : "warn"} />
        <KpiCard label="Pending Tasks" value={c.pendingTasks} tone="warn" />
        <KpiCard label="Completed Tasks" value={c.completedTasks.toLocaleString()} tone="good" />
        <KpiCard label="Expiring Docs" value={c.expiringDocs}
          tone={c.expiringDocs > 5 ? "bad" : "warn"} />
      </div>

      <Card title="Compliance Status by Area">
        <div className="space-y-4">
          {c.byArea.map((a) => (
            <div key={a.area}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-300">{a.area}</span>
                <span className="tabular-nums text-slate-400">{a.pct}%</span>
              </div>
              <ProgressBar pct={a.pct} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
