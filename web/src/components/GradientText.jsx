// Animated moving-gradient text for impactful titles (see .gradient-text in
// index.css). Renders inline so it can highlight a phrase within a heading.
export default function GradientText({ children, className = "" }) {
  return <span className={`gradient-text ${className}`}>{children}</span>;
}
