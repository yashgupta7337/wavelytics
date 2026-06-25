// ---------------------------------------------------------------------------
// Service telemetry feed.
// Produces the live operational metrics streamed to the console and advances
// them on every tick. Centralising the feed here keeps the views decoupled
// from the data source.
// ---------------------------------------------------------------------------

const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const randf = (min, max, d = 1) =>
  +(min + Math.random() * (max - min)).toFixed(d);

// Nudge a value by a small +/- delta, clamped to [min, max].
const nudge = (value, delta, min, max) =>
  Math.min(max, Math.max(min, value + rand(-delta, delta)));
const nudgef = (value, delta, min, max, d = 1) =>
  +Math.min(max, Math.max(min, value + randf(-delta, delta, d))).toFixed(d);

const timeLabel = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const TREND_POINTS = 12;

// Build the very first snapshot.
export function seedData() {
  const trend = Array.from({ length: TREND_POINTS }, (_, i) => ({
    t: `-${(TREND_POINTS - i) * 5}s`,
    processed: rand(40, 90),
    completed: rand(30, 80),
    throughput: rand(20, 60),
    openRisks: rand(8, 24),
  }));

  return {
    updatedAt: new Date().toISOString(),
    kpis: {
      reportingAccuracy: randf(94, 99, 1),
      processingSpeedHrs: randf(2, 6, 1),
      exceptions: rand(3, 18),
      workflowCompletion: randf(88, 98, 1),
      monitoringCoverage: randf(90, 99, 1),
      complianceReadiness: randf(85, 97, 1),
    },
    executive: {
      health: "Healthy",
      processedToday: rand(820, 1180),
      pending: rand(40, 160),
      completed: rand(700, 1050),
    },
    operational: {
      avgTurnaroundHrs: randf(2.5, 5.5, 1),
      inProgress: rand(20, 70),
      pending: rand(30, 120),
      completed: rand(700, 1050),
      backlog: rand(10, 90),
      errorRate: randf(0.5, 4, 1),
    },
    risk: {
      byCategory: [
        { name: "Operational", high: rand(1, 5), medium: rand(3, 9), low: rand(5, 14) },
        { name: "Data", high: rand(0, 4), medium: rand(2, 7), low: rand(4, 12) },
        { name: "Compliance", high: rand(0, 3), medium: rand(1, 6), low: rand(3, 10) },
        { name: "Reporting", high: rand(0, 2), medium: rand(1, 5), low: rand(2, 8) },
      ],
      collateralValueM: randf(180, 240, 1),
      overdueValuations: rand(2, 12),
      alerts: buildAlerts(),
    },
    compliance: {
      byArea: [
        { area: "Documentation", pct: rand(82, 99) },
        { area: "Audit Trail", pct: rand(80, 98) },
        { area: "Regulatory Reporting", pct: rand(78, 97) },
        { area: "Data Classification", pct: rand(85, 99) },
      ],
      pendingTasks: rand(4, 22),
      completedTasks: rand(120, 260),
      auditReadiness: rand(82, 97),
      expiringDocs: rand(1, 9),
    },
    trend,
  };
}

const ALERT_POOL = [
  { sev: "high", msg: "Collateral valuation overdue — Account #A-2231" },
  { sev: "high", msg: "Screening rule breach flagged on batch B-118" },
  { sev: "med", msg: "Reporting variance above threshold (Data)" },
  { sev: "med", msg: "3 documents pending audit-trail confirmation" },
  { sev: "low", msg: "Monitoring coverage dipped below 95%" },
  { sev: "low", msg: "Workflow backlog rising in onboarding queue" },
];

function buildAlerts() {
  const count = rand(2, 4);
  const shuffled = [...ALERT_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Evolve the previous snapshot into the next one (the "live" tick).
export function nextData(prev) {
  const k = prev.kpis;
  const e = prev.executive;
  const o = prev.operational;

  const newPoint = {
    t: timeLabel(),
    processed: rand(40, 90),
    completed: rand(30, 80),
    throughput: rand(20, 60),
    openRisks: rand(8, 24),
  };
  const trend = [...prev.trend.slice(1), newPoint];

  return {
    updatedAt: new Date().toISOString(),
    kpis: {
      reportingAccuracy: nudgef(k.reportingAccuracy, 0.4, 92, 99.5),
      processingSpeedHrs: nudgef(k.processingSpeedHrs, 0.3, 1.5, 7),
      exceptions: nudge(k.exceptions, 2, 0, 30),
      workflowCompletion: nudgef(k.workflowCompletion, 0.6, 85, 99.5),
      monitoringCoverage: nudgef(k.monitoringCoverage, 0.5, 88, 99.9),
      complianceReadiness: nudgef(k.complianceReadiness, 0.6, 80, 99),
    },
    executive: {
      health:
        k.complianceReadiness < 86 || k.reportingAccuracy < 94
          ? "Attention"
          : "Healthy",
      processedToday: e.processedToday + rand(2, 14),
      pending: nudge(e.pending, 8, 20, 220),
      completed: e.completed + rand(2, 12),
    },
    operational: {
      avgTurnaroundHrs: nudgef(o.avgTurnaroundHrs, 0.3, 2, 7),
      inProgress: nudge(o.inProgress, 6, 10, 100),
      pending: nudge(o.pending, 8, 20, 180),
      completed: o.completed + rand(1, 9),
      backlog: nudge(o.backlog, 6, 0, 140),
      errorRate: nudgef(o.errorRate, 0.4, 0.2, 6),
    },
    risk: {
      ...prev.risk,
      byCategory: prev.risk.byCategory.map((c) => ({
        ...c,
        high: nudge(c.high, 1, 0, 8),
        medium: nudge(c.medium, 1, 0, 12),
        low: nudge(c.low, 2, 0, 18),
      })),
      collateralValueM: nudgef(prev.risk.collateralValueM, 2, 150, 280),
      overdueValuations: nudge(prev.risk.overdueValuations, 2, 0, 20),
      alerts: Math.random() < 0.35 ? buildAlerts() : prev.risk.alerts,
    },
    compliance: {
      ...prev.compliance,
      byArea: prev.compliance.byArea.map((a) => ({
        ...a,
        pct: nudge(a.pct, 1, 75, 100),
      })),
      pendingTasks: nudge(prev.compliance.pendingTasks, 2, 0, 30),
      completedTasks: prev.compliance.completedTasks + rand(0, 4),
      auditReadiness: nudge(prev.compliance.auditReadiness, 1, 78, 99),
      expiringDocs: nudge(prev.compliance.expiringDocs, 1, 0, 14),
    },
    trend,
  };
}
