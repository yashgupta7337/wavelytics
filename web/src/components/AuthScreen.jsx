import { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { scorePassword } from "../lib/passwordStrength.js";
import PasswordStrength from "./PasswordStrength.jsx";

// Full-page sign in / create account experience. Two-column card (brand panel +
// form) floating over a drifting aurora background; a segmented control slides
// between "Sign in" and "Create account". Everyone on the same email domain
// shares one tenant workspace (enforced server-side).
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
  const strength = scorePassword(password);
  const canSubmit =
    !busy && (!isSignup || (strength.acceptable && password === confirm));

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (isSignup && !strength.acceptable) {
      setError("Please choose a stronger password.");
      return;
    }
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
    "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-14">
      {/* Drifting aurora background */}
      <div className="pointer-events-none absolute inset-0">
        <span
          className="aurora-blob"
          style={{
            width: "30rem",
            height: "30rem",
            top: "-7rem",
            left: "-5rem",
            background: "radial-gradient(circle, rgba(56,189,248,0.55), transparent 70%)",
            animationDelay: "0s",
          }}
        />
        <span
          className="aurora-blob"
          style={{
            width: "28rem",
            height: "28rem",
            bottom: "-7rem",
            right: "-5rem",
            background: "radial-gradient(circle, rgba(129,140,248,0.5), transparent 70%)",
            animationDelay: "-6s",
          }}
        />
        <span
          className="aurora-blob"
          style={{
            width: "20rem",
            height: "20rem",
            top: "28%",
            right: "22%",
            background: "radial-gradient(circle, rgba(34,211,238,0.4), transparent 70%)",
            animationDelay: "-12s",
          }}
        />
      </div>

      {/* Back to site — outside the card, top-left */}
      <a
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur transition hover:border-slate-500 hover:text-white"
      >
        ← Back to site
      </a>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
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
              <span className="text-xs text-slate-500">a product by WaveConnect</span>
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
            <p className="text-xs text-slate-600">© 2026 Wavelytics · a product by WaveConnect</p>
          </div>

          {/* Form panel */}
          <div className="p-7 sm:p-9">
            <a href="/" className="mb-6 flex items-baseline gap-2 lg:hidden">
              <span className="text-lg font-bold tracking-tight text-slate-100">Wavelytics</span>
              <span className="text-xs text-slate-500">a product by WaveConnect</span>
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
            <p className="mt-1 text-sm text-slate-400">
              {isSignup
                ? "Start with your work email — your whole team shares one workspace."
                : "Sign in to your Wavelytics workspace."}
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

              {/* Live strength meter (sign-up only) */}
              {isSignup && <PasswordStrength password={password} />}

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
                {isSignup && confirm && confirm !== password && (
                  <p className="mt-1 text-[11px] text-rose-400">Passwords don't match.</p>
                )}
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}
              {notice && <p className="text-xs text-emerald-400">{notice}</p>}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              </button>
            </form>
          </div>
        </div>

        {/* Continue to demo — outside / below the card */}
        <p className="mt-5 text-center text-sm text-slate-500">
          Just exploring?{" "}
          <button
            onClick={onSkip}
            className="font-semibold text-sky-300 underline-offset-2 transition hover:text-sky-200 hover:underline"
          >
            Continue to the live demo →
          </button>
        </p>
      </div>
    </div>
  );
}
