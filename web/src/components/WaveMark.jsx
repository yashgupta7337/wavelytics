// Wavelytics wave logo mark. Animated via the .wave-mark rules in index.css:
// the stroke colour drifts through blue/cyan/indigo shades with a soft pulsing
// glow (respects prefers-reduced-motion). Used in the landing nav/footer, the
// dashboard header, and the auth screen.
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
      <path d="M2 8c2 0 2 1.8 4 1.8S8 8 10 8s2 1.8 4 1.8S16 8 18 8s2 1.8 4 1.8" />
      <path d="M2 14c2 0 2 1.8 4 1.8S8 14 10 14s2 1.8 4 1.8S16 14 18 14s2 1.8 4 1.8" />
    </svg>
  );
}
