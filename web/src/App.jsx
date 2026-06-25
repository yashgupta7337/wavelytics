import { useEffect, useState } from "react";
import { useLiveData } from "./useLiveData.js";
import { useAuth } from "./useAuth.js";
import AuthScreen from "./components/AuthScreen.jsx";
import UploadPanel from "./components/UploadPanel.jsx";
import Executive from "./views/Executive.jsx";
import Operational from "./views/Operational.jsx";
import Risk from "./views/Risk.jsx";
import Compliance from "./views/Compliance.jsx";

const TABS = [
  { id: "executive", label: "Executive", Component: Executive },
  { id: "operational", label: "Operational", Component: Operational },
  { id: "risk", label: "Risk", Component: Risk },
  { id: "compliance", label: "Compliance", Component: Compliance },
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
  const [showUpload, setShowUpload] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const data = useLiveData(3000, token, refresh);
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

  // Full-page auth screen (only when configured, signed out, and requested).
  if (authEnabled && authView && !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-500">
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
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="block">
            <h1 className="text-lg font-bold text-slate-100">Wavelytics</h1>
            <p className="text-xs text-slate-500">Operations &amp; Compliance Intelligence</p>
          </a>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              LIVE · updated {updated}
            </span>
            {!ownData && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
                DEMO
              </span>
            )}
            {authEnabled && user ? (
              <>
                <button
                  onClick={() => setShowUpload(true)}
                  className="rounded-lg bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-400"
                >
                  Upload CSV
                </button>
                <span className="hidden text-slate-500 sm:inline">{user.email}</span>
                <button onClick={signOut} className="text-slate-400 hover:text-slate-200">
                  Sign out
                </button>
              </>
            ) : authEnabled ? (
              <button
                onClick={() => setAuthView("signin")}
                className="rounded-lg border border-slate-700 px-3 py-1.5 font-semibold text-slate-200 hover:border-sky-500 hover:text-sky-300"
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
            : "border-slate-800 bg-slate-900/20 text-slate-400"
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

      <nav className="border-b border-slate-800 bg-slate-900/20">
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                active === t.id
                  ? "border-sky-400 text-sky-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Component data={data} />
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-600">
        © 2026 Wavelytics · a WaveConnect company
      </footer>

      {showUpload && (
        <UploadPanel
          token={token}
          onClose={() => setShowUpload(false)}
          onUploaded={() => setRefresh((n) => n + 1)}
        />
      )}
    </div>
  );
}
