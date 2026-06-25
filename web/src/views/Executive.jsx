import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, KpiCard, Badge } from "../components/ui.jsx";
import { toneFor } from "../useAlerts.js";

export default function Executive({ data, status = {} }) {
  const { kpis, executive, trend } = data;
  const healthy = executive.health === "Healthy";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Overall Health</p>
          <div className="mt-2">
            <Badge sev={healthy ? "good" : "med"}>{executive.health}</Badge>
          </div>
        </Card>
        <KpiCard label="Processed Today" value={executive.processedToday.toLocaleString()} />
        <KpiCard label="Completed" value={executive.completed.toLocaleString()} tone="good" />
        <KpiCard label="Pending" value={executive.pending} tone="warn" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Reporting Accuracy" value={kpis.reportingAccuracy} unit="%"
          tone={toneFor(status, "reporting_accuracy", "good")} />
        <KpiCard label="Workflow Completion" value={kpis.workflowCompletion} unit="%"
          tone={toneFor(status, "workflow_completion", "good")} />
        <KpiCard label="Compliance Readiness" value={kpis.complianceReadiness} unit="%"
          tone={toneFor(status, "compliance_readiness", "warn")} />
      </div>

      <Card title="Throughput Trend" subtitle="Processed vs. completed (live)">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="gProc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="t" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="processed" stroke="#38bdf8" fill="url(#gProc)" />
            <Area type="monotone" dataKey="completed" stroke="#34d399" fill="url(#gComp)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};
