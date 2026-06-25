import { RULES, scorePassword } from "../lib/passwordStrength.js";

// Live password strength: a 4-segment bar + label, plus a rules checklist that
// ticks green as each requirement is met. Shown under the password field on
// sign-up once the user starts typing.
const BAR_COLORS = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"];
const LABEL_COLORS = [
  "text-rose-400",
  "text-rose-400",
  "text-amber-400",
  "text-sky-400",
  "text-emerald-400",
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const { score, label, checks } = scorePassword(password);

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < Math.max(score, 1) && score > 0 ? BAR_COLORS[score] : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${LABEL_COLORS[score]}`}>{label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map((r) => {
          const ok = checks[r.key];
          return (
            <li
              key={r.key}
              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                ok ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              <span>{ok ? "✓" : "○"}</span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
