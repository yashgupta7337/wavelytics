import { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

// CSV upload for the signed-in tenant. Reads the file in the browser and POSTs
// it to the API with the Supabase access token; the API maps it onto the
// dashboard metrics for this tenant only.
export default function UploadPanel({ token, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch(
        `${API}/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/csv", Authorization: `Bearer ${token}` },
          body: text,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || `Upload failed (${res.status})`);
      setResult(json);
      onUploaded?.();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Upload metrics (CSV)</h2>
          <button onClick={onClose} className="text-muted hover:text-muted" aria-label="Close">✕</button>
        </div>
        <p className="mb-4 text-xs text-muted">
          Upload a <code className="text-muted">metric,value</code> CSV to replace this
          workspace's live numbers.{" "}
          <a href={`${API}/api/template.csv`} className="text-sky-400 hover:text-sky-300" download>
            Download the template
          </a>{" "}
          for the exact format.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="file" accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-surface-2"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {result && (
            <p className="text-xs text-emerald-400">
              Uploaded — {result.applied} of {result.rows} metrics applied. The dashboard will refresh.
            </p>
          )}
          <button
            type="submit" disabled={busy || !file}
            className="w-full rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}
