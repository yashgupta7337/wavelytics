// KPI/alert rules engine — pure functions, no DB. Evaluates a metrics snapshot
// against per-metric thresholds to produce red/amber/green status + messages.
//
// A rule's `comparator` encodes the metric's "good" direction:
//   - "below": higher is good (accuracy, completion, coverage). Breach when the
//     value drops to/below warn (amber) or crit (red).
//   - "above": lower is good (errors, backlog, turnaround). Breach when the value
//     rises to/above warn (amber) or crit (red).

export const METRIC_ACCESSORS = {
  reporting_accuracy: (s) => s?.kpis?.reportingAccuracy,
  processing_speed_hrs: (s) => s?.kpis?.processingSpeedHrs,
  exceptions: (s) => s?.kpis?.exceptions,
  workflow_completion: (s) => s?.kpis?.workflowCompletion,
  monitoring_coverage: (s) => s?.kpis?.monitoringCoverage,
  compliance_readiness: (s) => s?.kpis?.complianceReadiness,
  error_rate: (s) => s?.operational?.errorRate,
  backlog: (s) => s?.operational?.backlog,
  avg_turnaround_hrs: (s) => s?.operational?.avgTurnaroundHrs,
  overdue_valuations: (s) => s?.risk?.overdueValuations,
  audit_readiness: (s) => s?.compliance?.auditReadiness,
  expiring_docs: (s) => s?.compliance?.expiringDocs,
  pending_tasks: (s) => s?.compliance?.pendingTasks,
};

// Sensible defaults derived from the previously-hardcoded view thresholds.
export const DEFAULT_RULES = [
  { metric_key: "reporting_accuracy", label: "Reporting accuracy", comparator: "below", warn: 96, crit: 94, unit: "%", enabled: true },
  { metric_key: "compliance_readiness", label: "Compliance readiness", comparator: "below", warn: 90, crit: 86, unit: "%", enabled: true },
  { metric_key: "workflow_completion", label: "Workflow completion", comparator: "below", warn: 92, crit: 88, unit: "%", enabled: true },
  { metric_key: "monitoring_coverage", label: "Monitoring coverage", comparator: "below", warn: 95, crit: 90, unit: "%", enabled: true },
  { metric_key: "audit_readiness", label: "Audit readiness", comparator: "below", warn: 90, crit: 82, unit: "%", enabled: true },
  { metric_key: "processing_speed_hrs", label: "Processing speed", comparator: "above", warn: 5, crit: 6, unit: "hrs", enabled: true },
  { metric_key: "avg_turnaround_hrs", label: "Avg turnaround", comparator: "above", warn: 4, crit: 6, unit: "hrs", enabled: true },
  { metric_key: "error_rate", label: "Error rate", comparator: "above", warn: 2, crit: 4, unit: "%", enabled: true },
  { metric_key: "exceptions", label: "Exceptions", comparator: "above", warn: 12, crit: 20, unit: "", enabled: true },
  { metric_key: "backlog", label: "Backlog", comparator: "above", warn: 60, crit: 100, unit: "", enabled: true },
  { metric_key: "overdue_valuations", label: "Overdue valuations", comparator: "above", warn: 6, crit: 12, unit: "", enabled: true },
  { metric_key: "expiring_docs", label: "Expiring documents", comparator: "above", warn: 5, crit: 10, unit: "", enabled: true },
  { metric_key: "pending_tasks", label: "Pending compliance tasks", comparator: "above", warn: 15, crit: 25, unit: "", enabled: true },
];

export function defaultRules() {
  return DEFAULT_RULES.map((r) => ({ ...r }));
}

function fmt(v, unit) {
  if (v == null) return "—";
  return unit === "%" ? `${v}%` : unit ? `${v} ${unit}` : `${v}`;
}

// Evaluate a snapshot against rules → array of per-metric results.
export function evaluate(snapshot, rules) {
  const results = [];
  for (const r of rules || []) {
    if (r.enabled === false) continue;
    const get = METRIC_ACCESSORS[r.metric_key];
    if (!get) continue;
    const raw = get(snapshot);
    if (raw == null || Number.isNaN(Number(raw))) continue;
    const value = Number(raw);
    const warn = Number(r.warn);
    const crit = Number(r.crit);

    let status = "green";
    let threshold = null;
    if (r.comparator === "above") {
      if (value >= crit) { status = "red"; threshold = crit; }
      else if (value >= warn) { status = "amber"; threshold = warn; }
    } else {
      if (value <= crit) { status = "red"; threshold = crit; }
      else if (value <= warn) { status = "amber"; threshold = warn; }
    }

    const message =
      status === "green"
        ? `${r.label} is healthy (${fmt(value, r.unit)}).`
        : `${r.label} ${fmt(value, r.unit)} is ${
            r.comparator === "above" ? "above" : "below"
          } the ${status === "red" ? "critical" : "warning"} threshold of ${fmt(threshold, r.unit)}.`;

    results.push({
      metric_key: r.metric_key,
      label: r.label,
      value,
      unit: r.unit || "",
      status,
      threshold,
      comparator: r.comparator,
      message,
    });
  }
  return results;
}

export function summarize(results) {
  const counts = { green: 0, amber: 0, red: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  const overall = counts.red > 0 ? "critical" : counts.amber > 0 ? "attention" : "healthy";
  return { ...counts, total: results.length, overall };
}

// Convenience: a metric_key -> status map for the dashboard views.
export function statusByMetric(results) {
  const map = {};
  for (const r of results) map[r.metric_key] = r.status;
  return map;
}
