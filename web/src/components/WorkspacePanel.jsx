import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

// Read-only workspace overview: who's in the tenant and the recent CSV uploads.
// Members join automatically by email domain (see db.resolveTenant), so there's
// nothing to invite or manage — this is purely informational. Modeled on
// RulesPanel (fixed-inset overlay, Bearer fetch on mount).
export default function WorkspacePanel({ token, onClose }) {
  const [members, setMembers] = useState(null);
  const [uploads, setUploads] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [m, u] = await Promise.all([
          fetch(`${API}/api/members`, { headers }).then((r) => r.json()),
          fetch(`${API}/api/uploads`, { headers }).then((r) => r.json()),
        ]);
        if (!alive) return;
        setMembers(m.members || []);
        setUploads(u.uploads || []);
      } catch {
        if (alive) setError("Couldn't load workspace details.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const when = (x) => (x ? new Date(x).toLocaleString() : "—");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Workspace</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 text-xs text-rose-400">{error}</p>}

        <div className="-mx-1 flex-1 space-y-6 overflow-y-auto px-1">
          {/* Members */}
          <section>
            <h3 className="mb-1 text-sm font-semibold text-ink">Members</h3>
            <p className="mb-3 text-xs text-muted">
              Teammates join automatically when they sign up with an email on your
              domain. Enrollment is by email domain — there's nothing to invite.
            </p>
            {!members ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted">No members yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-faint">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Role</th>
                    <th className="py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {members.map((m) => (
                    <tr key={m.email}>
                      <td className="py-2 pr-3 text-ink">{m.email}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                            m.role === "owner"
                              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                              : "border-line bg-surface-2/60 text-muted"
                          }`}
                        >
                          {m.role === "owner" ? "Owner" : "Member"}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-muted">{when(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Upload history */}
          <section>
            <h3 className="mb-1 text-sm font-semibold text-ink">Upload history</h3>
            <p className="mb-3 text-xs text-muted">
              Recent CSV uploads that refreshed your workspace data.
            </p>
            {!uploads ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-muted">No uploads yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-faint">
                  <tr>
                    <th className="py-2 pr-3 font-medium">File</th>
                    <th className="py-2 pr-3 font-medium">Rows</th>
                    <th className="py-2 pr-3 font-medium">Uploaded by</th>
                    <th className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {uploads.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2 pr-3 text-ink">{u.filename || "upload.csv"}</td>
                      <td className="py-2 pr-3 tabular-nums text-muted">{u.row_count}</td>
                      <td className="py-2 pr-3 text-muted">{u.uploaded_by_email || "—"}</td>
                      <td className="py-2 text-xs text-muted">{when(u.captured_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
