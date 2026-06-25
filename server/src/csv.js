// CSV ingest: turn a pilot client's metric export into a dashboard snapshot.
//
// Format is a simple two-column long form — `metric,value` — one metric per
// row, with an optional header. This is forgiving for non-technical users and
// maps 1:1 onto the KPI framework in the WaveConnect assessment reports
// (reporting accuracy, processing speed, exceptions, workflow completion,
// monitoring coverage, compliance readiness, plus the risk/compliance breakdowns).
//
// Unprovided metrics fall back to a neutral baseline so every view still
// renders; provided metrics are the client's real numbers.

const BASELINE = () => ({
  kpis: {
    reportingAccuracy: 96,
    processingSpeedHrs: 4,
    exceptions: 8,
    workflowCompletion: 93,
    monitoringCoverage: 95,
    complianceReadiness: 92,
  },
  executive: { processedToday: 1000, pending: 80, completed: 900 },
  operational: {
    avgTurnaroundHrs: 4,
    inProgress: 40,
    pending: 60,
    completed: 900,
    backlog: 40,
    errorRate: 1.5,
  },
  risk: {
    byCategory: [
      { name: "Operational", high: 2, medium: 5, low: 9 },
      { name: "Data", high: 1, medium: 4, low: 8 },
      { name: "Compliance", high: 1, medium: 3, low: 6 },
      { name: "Reporting", high: 0, medium: 2, low: 4 },
    ],
    collateralValueM: 210,
    overdueValuations: 5,
    alerts: [],
  },
  compliance: {
    byArea: [
      { area: "Documentation", pct: 92 },
      { area: "Audit Trail", pct: 90 },
      { area: "Regulatory Reporting", pct: 88 },
      { area: "Data Classification", pct: 93 },
    ],
    pendingTasks: 10,
    completedTasks: 180,
    auditReadiness: 90,
    expiringDocs: 4,
  },
});

// metric key -> setter on the snapshot. Keys are lower_snake_case.
const SCALAR = {
  reporting_accuracy: (s, v) => (s.kpis.reportingAccuracy = v),
  processing_speed_hrs: (s, v) => (s.kpis.processingSpeedHrs = v),
  exceptions: (s, v) => (s.kpis.exceptions = v),
  workflow_completion: (s, v) => (s.kpis.workflowCompletion = v),
  monitoring_coverage: (s, v) => (s.kpis.monitoringCoverage = v),
  compliance_readiness: (s, v) => (s.kpis.complianceReadiness = v),

  processed_today: (s, v) => (s.executive.processedToday = v),
  pending: (s, v) => (s.executive.pending = v),
  completed: (s, v) => (s.executive.completed = v),

  avg_turnaround_hrs: (s, v) => (s.operational.avgTurnaroundHrs = v),
  in_progress: (s, v) => (s.operational.inProgress = v),
  op_pending: (s, v) => (s.operational.pending = v),
  op_completed: (s, v) => (s.operational.completed = v),
  backlog: (s, v) => (s.operational.backlog = v),
  error_rate: (s, v) => (s.operational.errorRate = v),

  collateral_value_m: (s, v) => (s.risk.collateralValueM = v),
  overdue_valuations: (s, v) => (s.risk.overdueValuations = v),

  pending_tasks: (s, v) => (s.compliance.pendingTasks = v),
  completed_tasks: (s, v) => (s.compliance.completedTasks = v),
  audit_readiness: (s, v) => (s.compliance.auditReadiness = v),
  expiring_docs: (s, v) => (s.compliance.expiringDocs = v),
};

const RISK_CAT = { operational: 0, data: 1, compliance: 2, reporting: 3 };
const COMPLIANCE_AREA = {
  documentation: 0,
  audit_trail: 1,
  regulatory_reporting: 2,
  data_classification: 3,
};

// Split a single CSV line into fields, honoring simple double-quoting.
function splitLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

export function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(splitLine)
    .filter((f) => f.length >= 2)
    // Drop a header row like "metric,value".
    .filter(([k]) => !/^metric$/i.test(k))
    .map(([key, value]) => ({ key: key.toLowerCase().replace(/\s+/g, "_"), value }));
}

// Build a snapshot payload from parsed rows. Returns { snapshot, applied }.
export function buildSnapshot(rows) {
  const s = BASELINE();
  let applied = 0;

  for (const { key, value } of rows) {
    const num = Number(value);
    if (Number.isNaN(num)) continue;

    if (SCALAR[key]) {
      SCALAR[key](s, num);
      applied++;
      continue;
    }
    // risk_<category>_<severity>, e.g. risk_operational_high
    let m = key.match(/^risk_(operational|data|compliance|reporting)_(high|medium|low)$/);
    if (m) {
      s.risk.byCategory[RISK_CAT[m[1]]][m[2]] = num;
      applied++;
      continue;
    }
    // compliance_<area>_pct, e.g. compliance_audit_trail_pct
    m = key.match(/^compliance_(documentation|audit_trail|regulatory_reporting|data_classification)_pct$/);
    if (m) {
      s.compliance.byArea[COMPLIANCE_AREA[m[1]]].pct = num;
      applied++;
      continue;
    }
  }

  const k = s.kpis;
  s.executive.health =
    k.complianceReadiness < 86 || k.reportingAccuracy < 94 ? "Attention" : "Healthy";

  // A flat 12-point trend so charts render even without time-series history.
  const base = Math.round(s.executive.completed / 20);
  s.trend = Array.from({ length: 12 }, (_, i) => ({
    t: `-${(12 - i) * 5}s`,
    processed: base + (i % 3),
    completed: Math.round(base * 0.85) + (i % 2),
    throughput: Math.round(base * 0.6),
    openRisks: s.risk.byCategory.reduce((n, c) => n + c.high + c.medium, 0),
  }));

  s.updatedAt = new Date().toISOString();
  s.source = "upload";
  return { snapshot: s, applied };
}

export const TEMPLATE_CSV = `metric,value
reporting_accuracy,96.5
processing_speed_hrs,3.2
exceptions,7
workflow_completion,94.1
monitoring_coverage,95.8
compliance_readiness,91.0
processed_today,1040
pending,72
completed,960
avg_turnaround_hrs,3.4
in_progress,38
op_pending,55
op_completed,960
backlog,33
error_rate,1.2
collateral_value_m,212.5
overdue_valuations,6
risk_operational_high,2
risk_operational_medium,5
risk_operational_low,9
risk_data_high,1
risk_data_medium,4
risk_data_low,7
risk_compliance_high,1
risk_compliance_medium,3
risk_compliance_low,6
risk_reporting_high,0
risk_reporting_medium,2
risk_reporting_low,4
compliance_documentation_pct,93
compliance_audit_trail_pct,90
compliance_regulatory_reporting_pct,88
compliance_data_classification_pct,94
pending_tasks,9
completed_tasks,184
audit_readiness,91
expiring_docs,3
`;
