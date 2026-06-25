import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

// Per-tenant threshold editor. Loads the tenant's rules, lets the user tweak
// warn/crit/enabled per metric, and saves the full set back via PUT /api/rules.
export default function RulesPanel({ token, onClose, onSaved }) {
  const [rules, setRules] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/rules`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (alive) setRules(json.rules || []);
      } catch {
        if (alive) setError("Couldn't load rules.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  function update(i, patch) {
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rules }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Save failed");
      onSaved?.(json.rules);
      onClose?.();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  const numCls =
    "w-20 rounded-md border border-line bg-surface-2/80 px-2 py-1 text-sm text-ink outline-none focus:border-sky-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Alert rules</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">✕</button>
        </div>
        <p className="mb-4 text-xs text-muted">
          Set warning and critical thresholds per metric. "Below" metrics alert when the value
          falls under the threshold; "above" metrics alert when it rises over.
        </p>

        {error && <p className="mb-3 text-xs text-rose-400">{error}</p>}

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {!rules ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-2 font-medium">Metric</th>
                  <th className="py-2 pr-2 font-medium">Dir.</th>
                  <th className="py-2 pr-2 font-medium">Warn</th>
                  <th className="py-2 pr-2 font-medium">Critical</th>
                  <th className="py-2 font-medium">On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rules.map((r, i) => (
                  <tr key={r.metric_key} className={r.enabled ? "" : "opacity-50"}>
                    <td className="py-2 pr-2 text-ink">
                      {r.label}
                      {r.unit ? <span className="ml-1 text-faint">({r.unit})</span> : null}
                    </td>
                    <td className="py-2 pr-2 text-xs text-muted">
                      {r.comparator === "below" ? "below" : "above"}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={r.warn}
                        onChange={(e) => update(i, { warn: e.target.value })}
                        className={numCls}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={r.crit}
                        onChange={(e) => update(i, { crit: e.target.value })}
                        className={numCls}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={r.enabled !== false}
                        onChange={(e) => update(i, { enabled: e.target.checked })}
                        className="h-4 w-4 accent-sky-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !rules}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save rules"}
          </button>
        </div>
      </div>
    </div>
  );
}
