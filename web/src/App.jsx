import { useEffect, useState } from "react";
import { useLiveData } from "./useLiveData.js";
import { useAlerts } from "./useAlerts.js";
import { useAuth } from "./useAuth.js";
import AuthScreen from "./components/AuthScreen.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import RulesPanel from "./components/RulesPanel.jsx";
import AuditReport from "./components/AuditReport.jsx";
import Executive from "./views/Executive.jsx";
import Operational from "./views/Operational.jsx";
import Risk from "./views/Risk.jsx";
import Compliance from "./views/Compliance.jsx";
import Alerts from "./views/Alerts.jsx";

const TABS = [
  { id: "executive", label: "Executive", Component: Executive },
  { id: "operational", label: "Operational", Component: Operational },
  { id: "risk", label: "Risk", Component: Risk },
  { id: "compliance", label: "Compliance", Component: Compliance },
  { id: "alerts", label: "Alerts", Component: Alerts },
];

// Read ?auth=signin|signup from the URL (set by the landing page CTAs).
function initialAuthView() {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("auth");
  return v === "signin" || v === "signup" ? v : null;
}

export default function App() {
  const [active, setActive] = useState("executive");
  const { authEnabled, ready, user, token, signOut } = useAuth();
  const [authView, setAuthView] = useState(initialAuthView);
  const [verified, setVerified] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("verified") === "1"
  );
  const [showUpload, setShowUpload] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Sign out, then return to the marketing home page.
  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      window.location.assign("/");
    }
  }

  const data = useLiveData(3000, token, refresh);
  const alerts = useAlerts(token, refresh);
  const { Component } = TABS.find((t) => t.id === active);
  const updated = new Date(data.updatedAt).toLocaleTimeString();
  const ownData = data.source === "upload";

  // Once signed in, leave the auth screen and clean ?auth out of the URL.
  useEffect(() => {
    if (user && authView) {
      setAuthView(null);
      if (window.history?.replaceState) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [user, authView]);

  // Landing target for the email-confirmation link: a clean "you're verified" page.
  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink">You're verified</h1>
          <p className="mt-2 text-sm text-muted">
            Your email is confirmed. Sign in to your Wavelytics workspace.
          </p>
          <button
            onClick={() => {
              if (window.history?.replaceState) {
                window.history.replaceState({}, "", window.location.pathname);
              }
              setVerified(false);
              setAuthView("signin");
            }}
            className="mt-6 inline-flex rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Sign in now
          </button>
          <div className="mt-4">
            <a href="/" className="text-xs text-faint hover:text-muted">
              ← Back to site
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Full-page auth screen (only when configured, signed out, and requested).
  if (authEnabled && authView && !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
        Loading…
      </div>
    );
  }
  if (authEnabled && !user && authView) {
    return (
      <AuthScreen
        initialMode={authView}
        onAuthed={() => setAuthView(null)}
        onSkip={() => setAuthView(null)}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="border-b border-line bg-surface/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="block">
            <h1 className="text-lg font-bold text-ink">Wavelytics</h1>
            <p className="text-xs text-muted">Operations &amp; Compliance Intelligence</p>
          </a>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              LIVE · updated {updated}
            </span>
            {(alerts.summary.red > 0 || alerts.summary.amber > 0) && (
              <button
                onClick={() => setActive("alerts")}
                className={`rounded-full border px-2 py-0.5 font-semibold ${
                  alerts.summary.red > 0
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {alerts.summary.red > 0
                  ? `${alerts.summary.red} critical`
                  : `${alerts.summary.amber} warning`}
              </button>
            )}
            <ThemeToggle className="h-7 w-7" />
            {!ownData && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
                DEMO
              </span>
            )}
            {authEnabled && user ? (
              <>
                <button
                  onClick={() => setShowRules(true)}
                  className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-sky-500 hover:text-sky-300"
                >
                  Rules
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="rounded-lg bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-400"
                >
                  Upload CSV
                </button>
                <span className="hidden text-muted sm:inline">{user.email}</span>
                <button onClick={handleSignOut} className="text-muted hover:text-ink">
                  Sign out
                </button>
              </>
            ) : authEnabled ? (
              <button
                onClick={() => setAuthView("signin")}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-sky-500 hover:text-sky-300"
              >
                Sign in
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={`border-b text-xs ${
          ownData
            ? "border-emerald-900/50 bg-emerald-500/10 text-emerald-300"
            : "border-line bg-surface/20 text-muted"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-1.5">
          {ownData ? (
            "Showing your organization's live data."
          ) : authEnabled && user ? (
            "Sample data — upload a CSV to see your own metrics."
          ) : (
            <>
              Sample / concept data —{" "}
              {authEnabled ? (
                <button
                  onClick={() => setAuthView("signin")}
                  className="font-semibold text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline"
                >
                  sign in
                </button>
              ) : (
                "sign in"
              )}{" "}
              to load your organization's own metrics.
            </>
          )}
        </div>
      </div>

      <nav className="border-b border-line bg-surface/20">
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                active === t.id
                  ? "border-sky-400 text-sky-300"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Component data={data} status={alerts.statusByMetric} alerts={alerts} token={token} />
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-faint">
        © 2026 Wavelytics · a product by WaveConnect
      </footer>

      {showUpload && (
        <UploadPanel
          token={token}
          onClose={() => setShowUpload(false)}
          onUploaded={() => setRefresh((n) => n + 1)}
        />
      )}
      {showRules && (
        <RulesPanel
          token={token}
          onClose={() => setShowRules(false)}
          onSaved={() => setRefresh((n) => n + 1)}
        />
      )}

      {/* Off-screen; revealed only when printing (Alerts → Print / Save as PDF). */}
      <AuditReport alerts={alerts} user={user} />
    </div>
  );
}
