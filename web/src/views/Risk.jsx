import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, KpiCard, Badge } from "../components/ui.jsx";
import { tooltipStyle } from "./Executive.jsx";

export default function Risk({ data }) {
  const { risk } = data;
  const totalHigh = risk.byCategory.reduce((s, c) => s + c.high, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="High Risks Open" value={totalHigh} tone={totalHigh > 6 ? "bad" : "warn"} />
        <KpiCard label="Collateral Value" value={`$${risk.collateralValueM}M`} />
        <KpiCard label="Overdue Valuations" value={risk.overdueValuations}
          tone={risk.overdueValuations > 6 ? "bad" : "warn"} />
        <KpiCard label="Active Alerts" value={risk.alerts.length} tone="warn" />
      </div>

      <Card title="Open Risks by Category" subtitle="High / Medium / Low">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={risk.byCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="high" stackId="a" fill="#fb7185" name="High" />
            <Bar dataKey="medium" stackId="a" fill="#fbbf24" name="Medium" />
            <Bar dataKey="low" stackId="a" fill="#38bdf8" name="Low" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Early-Warning Alerts">
        <ul className="space-y-2">
          {risk.alerts.map((a, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-sm text-slate-300">{a.msg}</span>
              <Badge sev={a.sev}>{a.sev.toUpperCase()}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
