// Wavelytics wave logo mark. Two ripple lines flow horizontally (seamless loop
// via the SMIL translate — the wave repeats every 8 units, so translating by 8
// is invisible). A constant soft glow + a very subtle blue tint come from the
// .wave-mark rules in index.css. The flow is skipped under reduced-motion.
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// One tileable wave, 8-unit period, drawn wide (x: -8 → 36) so 0–24 stays
// covered through the whole -8 translate.
const WAVE =
  "q2 -2.4 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0";

export default function WaveMark({ className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`wave-mark ${className}`}
      aria-hidden="true"
    >
      <g>
        <path d={`M-8 9 ${WAVE}`} />
        <path d={`M-8 15 ${WAVE}`} />
        {!reduceMotion && (
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="-8 0"
            dur="2.4s"
            repeatCount="indefinite"
          />
        )}
      </g>
    </svg>
  );
}
