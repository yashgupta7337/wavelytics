import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, KpiCard, Stat } from "../components/ui.jsx";
import { tooltipStyle } from "./Executive.jsx";

export default function Operational({ data }) {
  const { operational: o, trend } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Avg Turnaround" value={o.avgTurnaroundHrs} unit="hrs"
          tone={o.avgTurnaroundHrs <= 4 ? "good" : "warn"} />
        <KpiCard label="In Progress" value={o.inProgress} />
        <KpiCard label="Pending" value={o.pending} tone="warn" />
        <KpiCard label="Error Rate" value={o.errorRate} unit="%"
          tone={o.errorRate <= 2 ? "good" : "bad"} />
      </div>

      <Card title="Workload Snapshot">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Completed" value={o.completed.toLocaleString()} tone="good" />
          <Stat label="In Progress" value={o.inProgress} />
          <Stat label="Pending" value={o.pending} tone="warn" />
          <Stat label="Backlog" value={o.backlog} tone={o.backlog > 60 ? "bad" : "default"} />
        </div>
      </Card>

      <Card title="Live Throughput" subtitle="Items processed per interval">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="t" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="throughput" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
