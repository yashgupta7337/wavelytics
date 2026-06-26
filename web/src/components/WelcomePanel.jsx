import { Card } from "./ui.jsx";

const API = import.meta.env.VITE_API_URL ?? "";

// First-run welcome for a signed-in user who hasn't uploaded data yet. Replaces
// the bare demo-with-a-banner experience with a clear next step: upload a CSV
// (or explore the demo first). Disappears automatically once they have data.
export default function WelcomePanel({ onUpload, onDismiss }) {
  return (
    <Card className="border-sky-500/30 bg-sky-500/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Welcome to your workspace</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            You're seeing sample data right now. Upload your first CSV to replace it
            with your organization's own metrics — accuracy, turnaround, risk, and
            compliance, scored against your rules.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={onUpload}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Upload CSV
          </button>
          <a
            href={`${API}/api/template.csv`}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-sky-500 hover:text-sky-300"
          >
            Download template
          </a>
          <button
            onClick={onDismiss}
            className="px-2 py-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            Explore the demo first →
          </button>
        </div>
      </div>
    </Card>
  );
}
