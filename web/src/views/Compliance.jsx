import { Card, KpiCard, ProgressBar } from "../components/ui.jsx";
import { toneFor } from "../useAlerts.js";

export default function Compliance({ data, status = {} }) {
  const { compliance: c } = data;

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Audit Readiness" value={c.auditReadiness} unit="%"
          tone={toneFor(status, "audit_readiness", "warn")} />
        <KpiCard label="Pending Tasks" value={c.pendingTasks}
          tone={toneFor(status, "pending_tasks", "warn")} />
        <KpiCard label="Completed Tasks" value={c.completedTasks.toLocaleString()} tone="good" />
        <KpiCard label="Expiring Docs" value={c.expiringDocs}
          tone={toneFor(status, "expiring_docs", "warn")} />
      </div>

      <Card title="Compliance Status by Area" className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {c.byArea.map((a) => (
            <div key={a.area}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted">{a.area}</span>
                <span className="tabular-nums text-muted">{a.pct}%</span>
              </div>
              <ProgressBar pct={a.pct} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
