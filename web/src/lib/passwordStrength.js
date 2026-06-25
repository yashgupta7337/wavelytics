// Lightweight password strength scoring for the sign-up form.
// Returns the individual rule checks, a 0–4 score, and a human label.
// Intentionally dependency-free — good enough to guide users, not a security
// control (Supabase still enforces its own minimum server-side).

export const RULES = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { key: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "A number", test: (p) => /\d/.test(p) },
  { key: "symbol", label: "A symbol (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const LABELS = ["Weak", "Weak", "Fair", "Good", "Strong"];

export function scorePassword(password = "") {
  const checks = {};
  let passed = 0;
  for (const rule of RULES) {
    const ok = rule.test(password);
    checks[rule.key] = ok;
    if (ok) passed++;
  }
  // Score 0–4: base on rules passed, with a small bonus for longer passwords.
  let score = Math.max(0, passed - 1); // 0 rules => 0, 5 rules => 4
  if (password.length >= 12 && passed >= 4) score = 4;
  if (!password) score = 0;

  return {
    score,
    label: LABELS[score],
    checks,
    // Usable for sign-up: a reasonable bar (length + at least Fair).
    acceptable: checks.length && score >= 2,
  };
}
