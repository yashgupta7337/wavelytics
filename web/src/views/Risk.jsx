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
import { toneFor } from "../useAlerts.js";
import { useChartTheme } from "../lib/useChartTheme.js";

export default function Risk({ data, status = {} }) {
  const { risk } = data;
  const totalHigh = risk.byCategory.reduce((s, c) => s + c.high, 0);
  const ct = useChartTheme();

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="High Risks Open" value={totalHigh} tone={totalHigh > 6 ? "bad" : "warn"} />
        <KpiCard label="Collateral Value" value={`$${risk.collateralValueM}M`} />
        <KpiCard label="Overdue Valuations" value={risk.overdueValuations}
          tone={toneFor(status, "overdue_valuations", "warn")} />
        <KpiCard label="Active Alerts" value={risk.alerts.length} tone="warn" />
      </div>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <Card title="Open Risks by Category" subtitle="High / Medium / Low"
          className="lg:flex lg:min-h-0 lg:flex-col">
          <div className="h-[280px] w-full min-w-0 lg:h-auto lg:min-h-0 lg:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={risk.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="name" stroke={ct.axis} fontSize={11} />
              <YAxis stroke={ct.axis} fontSize={11} />
              <Tooltip contentStyle={ct.tooltip} cursor={{ fill: ct.cursor }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="high" stackId="a" fill="#fb7185" name="High" />
              <Bar dataKey="medium" stackId="a" fill="#fbbf24" name="Medium" />
              <Bar dataKey="low" stackId="a" fill="#38bdf8" name="Low" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Early-Warning Alerts" className="lg:flex lg:min-h-0 lg:flex-col">
          <ul className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {risk.alerts.map((a, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2">
                <span className="text-sm text-muted">{a.msg}</span>
                <Badge sev={a.sev}>{a.sev.toUpperCase()}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
