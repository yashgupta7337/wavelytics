// Small shared presentational components used across all dashboard views.

export function Card({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface/60 p-4 shadow-sm ${className}`}
    >
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiCard({ label, value, unit, tone = "default", hint }) {
  const tones = {
    default: "text-ink",
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-rose-400",
  };
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${tones[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-lg font-medium text-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function Stat({ label, value, tone = "default" }) {
  const tones = {
    default: "text-ink",
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-rose-400",
  };
  return (
    <div className="rounded-lg bg-surface-2/50 px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export function Badge({ children, sev = "low" }) {
  const map = {
    high: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    med: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[sev]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ pct }) {
  const color =
    pct >= 95 ? "bg-emerald-500" : pct >= 85 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
