import { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { scorePassword } from "../lib/passwordStrength.js";
import PasswordStrength from "./PasswordStrength.jsx";

// Full-page sign in / create account experience. Two-column card (brand panel +
// form) floating over a drifting aurora background; a segmented control slides
// between "Sign in" and "Create account", and the form content fades up on
// switch. Everyone on the same email domain shares one tenant workspace.
const VALUE_POINTS = [
  "Operational, risk & compliance health in one live view",
  "Your data stays yours — strict per-tenant separation",
  "RAG alerts and audit-ready exports, built in",
];

// Practical RFC 5322 email check (no eager validation — only on submit).
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function AuthScreen({ initialMode = "signin", onAuthed, onSkip }) {
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({}); // { email, password, confirm, form }
  const [notice, setNotice] = useState("");
  const [signinFailed, setSigninFailed] = useState(false); // wrong email/pw combo

  const isSignup = mode === "signup";

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setNotice("");
    setSigninFailed(false);
    // Clear the form when toggling between sign in / sign up.
    setEmail("");
    setPassword("");
    setConfirm("");
  }

  function clearError(field) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    if (signinFailed) setSigninFailed(false);
  }

  function validate() {
    const errs = {};
    if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
    if (isSignup) {
      const { checks } = scorePassword(password);
      const missing = [];
      if (!checks.length) missing.push("at least 8 characters");
      if (!checks.upper) missing.push("an uppercase letter");
      if (!checks.symbol) missing.push("a special character");
      if (missing.length) errs.password = `Password needs ${missing.join(", ")}.`;
      if (password !== confirm) errs.confirm = "Passwords don't match.";
    } else if (!password) {
      errs.password = "Enter your password.";
    }
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    setNotice("");
    setSigninFailed(false);
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onAuthed?.(); // email confirmation off — signed in immediately
        } else {
          setNotice("Account created. Check your inbox to confirm, then sign in.");
          switchMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/not confirmed/i.test(error.message)) {
            setNotice("Please confirm your email first — check your inbox.");
          } else {
            // Supabase returns a single generic error for unknown-email and
            // wrong-password (anti-enumeration), so we offer both next steps.
            setSigninFailed(true);
          }
          return;
        }
        onAuthed?.();
      }
    } catch (err) {
      setErrors({ form: err.message || "Authentication failed." });
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!EMAIL_RE.test(email)) {
      setErrors({ email: "Enter your email above, then tap Forgot password." });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/?auth=signin`,
      });
      if (error) throw error;
      setSigninFailed(false);
      setNotice(`Password reset link sent to ${email}.`);
    } catch (err) {
      setErrors({ form: err.message || "Could not send reset email." });
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-surface-2/80 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500";
  const errInputCls = "border-rose-500/70 focus:border-rose-500";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-14">
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

      {/* Back to site — pill ghost button, outside the card, top-left */}
      <a
        href="/"
        className="group absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur transition hover:border-sky-500/60 hover:bg-sky-500/10 hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        >
          <path d="M19 12H5m6-7-7 7 7 7" />
        </svg>
        Back to site
      </a>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          {/* Brand / value panel */}
          <div
            className="relative hidden flex-col justify-between p-8 lg:flex"
            style={{
              background:
                "radial-gradient(120% 100% at 0% 0%, rgba(56,189,248,0.18) 0%, rgba(15,23,42,0) 60%)",
            }}
          >
            <a href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-ink">Wavelytics</span>
              <span className="text-xs text-muted">a product by WaveConnect</span>
            </a>
            <div className="my-8">
              <h2 className="text-2xl font-bold leading-snug text-ink">
                Operations &amp; Compliance Intelligence
              </h2>
              <p className="mt-2 text-sm text-muted">
                One pane of glass over service performance, risk, and audit readiness.
              </p>
              <ul className="mt-6 space-y-3">
                {VALUE_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-0.5 text-sky-400">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-faint">© 2026 Wavelytics · a product by WaveConnect</p>
          </div>

          {/* Form panel */}
          <div className="p-7 sm:p-9">
            <a href="/" className="mb-6 flex items-baseline gap-2 lg:hidden">
              <span className="text-lg font-bold tracking-tight text-ink">Wavelytics</span>
              <span className="text-xs text-muted">a product by WaveConnect</span>
            </a>

            {/* Sliding segmented toggle */}
            <div className="relative grid grid-cols-2 rounded-lg border border-line bg-surface-2/60 p-1 text-sm font-semibold">
              <span
                className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-sky-500 shadow transition-transform duration-300 ease-out ${
                  isSignup ? "translate-x-[calc(100%+0.25rem)]" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`relative z-10 rounded-md py-2 text-center transition-colors ${
                  isSignup ? "text-muted hover:text-ink" : "text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`relative z-10 rounded-md py-2 text-center transition-colors ${
                  isSignup ? "text-white" : "text-muted hover:text-ink"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Heading fades up on each mode switch */}
            <div key={mode} className="fade-up">
              <h1 className="mt-6 text-xl font-bold text-ink">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {isSignup
                  ? "Start with your work email — your whole team shares one workspace."
                  : "Sign in to your Wavelytics workspace."}
              </p>
            </div>

            <form onSubmit={submit} noValidate className="mt-5 space-y-3">
              <div>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  placeholder="you@company.com"
                  className={`${inputCls} ${errors.email ? errInputCls : ""}`}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  placeholder="Password"
                  className={`${inputCls} ${errors.password ? errInputCls : ""}`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
                )}
                {isSignup && <PasswordStrength password={password} />}
              </div>

              {/* Confirm password animates in for sign-up */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isSignup ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    clearError("confirm");
                  }}
                  placeholder="Confirm password"
                  className={`${inputCls} ${errors.confirm ? errInputCls : ""}`}
                />
                {errors.confirm && (
                  <p className="mt-1 text-xs text-rose-400">{errors.confirm}</p>
                )}
              </div>

              {/* Wrong email/password — soft message with both next steps */}
              {signinFailed && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  That email and password don't match.
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-semibold text-sky-300 underline-offset-2 hover:underline"
                    >
                      Create an account →
                    </button>
                  </div>
                </div>
              )}

              {errors.form && <p className="text-xs text-rose-400">{errors.form}</p>}
              {notice && <p className="text-xs text-emerald-400">{notice}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
              </button>

              {!isSignup && (
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="w-full text-center text-xs text-faint transition hover:text-ink"
                >
                  Forgot password?
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Continue to demo — outside / below the card */}
        <p className="mt-5 text-center text-sm text-muted">
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
