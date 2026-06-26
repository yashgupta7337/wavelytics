// Wavelytics wave logo mark. Two static wave lines with a constant soft glow
// (see .wave-mark in index.css). No motion, no color animation.
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
      <path d="M2 9 q2.75 -3 5.5 0 t5.5 0 t5.5 0" />
      <path d="M2 15 q2.75 -3 5.5 0 t5.5 0 t5.5 0" />
    </svg>
  );
}
