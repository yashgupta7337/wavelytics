import { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { scorePassword } from "../lib/passwordStrength.js";
import PasswordStrength from "./PasswordStrength.jsx";
import WaveMark from "./WaveMark.jsx";

// Reached from the password-reset email link (/app/?recovery=1). Supabase has
// already established a temporary recovery session, so we just collect a new
// password, call updateUser, then sign out so the temp session doesn't slip the
// user into the app — they sign in fresh with the new password. Styled to match
// AuthScreen (aurora background, single card).
export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({}); // { password, confirm, form }
  const [done, setDone] = useState(false);

  const inputCls =
    "w-full rounded-lg border border-line bg-surface-2/80 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-sky-500";
  const errInputCls = "border-rose-500/70 focus:border-rose-500";

  function validate() {
    const errs = {};
    const { checks } = scorePassword(password);
    const missing = [];
    if (!checks.length) missing.push("at least 8 characters");
    if (!checks.upper) missing.push("an uppercase letter");
    if (!checks.symbol) missing.push("a special character");
    if (missing.length) errs.password = `Password needs ${missing.join(", ")}.`;
    if (password !== confirm) errs.confirm = "Passwords don't match.";
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Drop the temporary recovery session; the user signs in with the new pw.
      await supabase.auth.signOut();
      setDone(true);
      setTimeout(() => onDone?.(), 1200);
    } catch (err) {
      setErrors({ form: err.message || "Could not update password." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-14">
      {/* Drifting aurora background (matches AuthScreen) */}
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
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface/80 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <a href="/" className="mb-6 flex items-center gap-2">
            <WaveMark className="h-6 w-6 shrink-0" />
            <span className="text-lg font-bold tracking-tight text-ink">Wavelytics</span>
            <span className="text-xs text-muted">a product by WaveConnect</span>
          </a>

          {done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-ink">Password updated</h1>
              <p className="mt-1 text-sm text-muted">Taking you to sign in…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-ink">Set a new password</h1>
              <p className="mt-1 text-sm text-muted">
                Choose a new password for your Wavelytics account.
              </p>

              <form onSubmit={submit} noValidate className="mt-5 space-y-3">
                <div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="New password"
                    className={`${inputCls} ${errors.password ? errInputCls : ""}`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
                  )}
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setErrors((p) => ({ ...p, confirm: undefined }));
                    }}
                    placeholder="Confirm new password"
                    className={`${inputCls} ${errors.confirm ? errInputCls : ""}`}
                  />
                  {errors.confirm && (
                    <p className="mt-1 text-xs text-rose-400">{errors.confirm}</p>
                  )}
                </div>

                {errors.form && <p className="text-xs text-rose-400">{errors.form}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}

          <div className="mt-5 text-center">
            <a href="/app/" className="text-xs text-faint transition hover:text-ink">
              ← Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
