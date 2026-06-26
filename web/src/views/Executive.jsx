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
import { useChartTheme } from "../lib/useChartTheme.js";

export default function Executive({ data, status = {} }) {
  const { kpis, executive, trend } = data;
  const healthy = executive.health === "Healthy";
  const ct = useChartTheme();

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Reporting Accuracy" value={kpis.reportingAccuracy} unit="%"
          tone={toneFor(status, "reporting_accuracy", "good")} />
        <KpiCard label="Workflow Completion" value={kpis.workflowCompletion} unit="%"
          tone={toneFor(status, "workflow_completion", "good")} />
        <KpiCard label="Compliance Readiness" value={kpis.complianceReadiness} unit="%"
          tone={toneFor(status, "compliance_readiness", "warn")} />
      </div>

      <Card title="Throughput Trend" subtitle="Processed vs. completed (live)"
        className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="h-[280px] w-full min-w-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
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
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="t" stroke={ct.axis} fontSize={11} />
            <YAxis stroke={ct.axis} fontSize={11} />
            <Tooltip contentStyle={ct.tooltip} cursor={{ stroke: ct.grid }} />
            <Area type="monotone" dataKey="processed" stroke="#38bdf8" fill="url(#gProc)" />
            <Area type="monotone" dataKey="completed" stroke="#34d399" fill="url(#gComp)" />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
