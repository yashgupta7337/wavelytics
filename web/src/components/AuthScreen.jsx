import { useState } from "react";
import { supabase } from "../lib/supabase.js";

// Full-page sign in / create account experience. Replaces the old modal.
// A two-column layout (brand panel + form); on the form side a segmented
// control slides between "Sign in" and "Create account". Everyone on the same
// email domain shares one tenant workspace (enforced server-side).
const VALUE_POINTS = [
  "Operational, risk & compliance health in one live view",
  "Your data stays yours — strict per-tenant separation",
  "RAG alerts and audit-ready exports, built in",
];

export default function AuthScreen({ initialMode = "signin", onAuthed, onSkip }) {
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isSignup = mode === "signup";

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (isSignup && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onAuthed?.(); // email confirmation is off — signed in immediately
        } else {
          setNotice("Account created. Check your inbox to confirm, then sign in.");
          switchMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed?.();
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl lg:grid-cols-2">
        {/* Brand / value panel */}
        <div
          className="relative hidden flex-col justify-between p-8 lg:flex"
          style={{
            background:
              "radial-gradient(120% 100% at 0% 0%, rgba(56,189,248,0.18) 0%, rgba(15,23,42,0) 60%)",
          }}
        >
          <a href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-100">Wavelytics</span>
            <span className="text-xs text-slate-500">a WaveConnect company</span>
          </a>
          <div className="my-8">
            <h2 className="text-2xl font-bold leading-snug text-slate-100">
              Operations &amp; Compliance Intelligence
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              One pane of glass over service performance, risk, and audit readiness.
            </p>
            <ul className="mt-6 space-y-3">
              {VALUE_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-sky-400">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-600">© 2026 Wavelytics · a WaveConnect company</p>
        </div>

        {/* Form panel */}
        <div className="p-7 sm:p-9">
          {/* Mobile-only wordmark */}
          <a href="/" className="mb-6 flex items-baseline gap-2 lg:hidden">
            <span className="text-lg font-bold tracking-tight text-slate-100">Wavelytics</span>
            <span className="text-xs text-slate-500">a WaveConnect company</span>
          </a>

          {/* Sliding segmented toggle */}
          <div className="relative grid grid-cols-2 rounded-lg border border-slate-800 bg-slate-800/60 text-sm font-semibold">
            <span
              className={`absolute inset-y-0 left-0 w-1/2 rounded-lg bg-sky-500 shadow transition-transform duration-300 ease-out ${
                isSignup ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`relative z-10 py-2.5 text-center transition-colors ${
                isSignup ? "text-slate-400 hover:text-slate-200" : "text-white"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`relative z-10 py-2.5 text-center transition-colors ${
                isSignup ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create account
            </button>
          </div>

          <h1 className="mt-6 text-xl font-bold text-slate-100">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isSignup
              ? "Use your work email — your team shares one workspace."
              : "Sign in to see your organization's own metrics."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputCls}
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputCls}
            />
            {/* Confirm password animates in for sign-up */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isSignup ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <input
                type="password"
                required={isSignup}
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className={inputCls}
              />
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}
            {notice && <p className="text-xs text-emerald-400">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <a href="/" className="hover:text-slate-300">
              ← Back to site
            </a>
            <button onClick={onSkip} className="hover:text-slate-300">
              Continue to the demo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
