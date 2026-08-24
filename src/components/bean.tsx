export function Bean({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 130" aria-hidden="true" className={className}>
      <ellipse cx="50" cy="65" rx="46" ry="62" fill="var(--roast)" />
      <path
        d="M50 8 C36 40 36 90 50 122"
        stroke="var(--cream)"
        strokeWidth="7"
        fill="none"
      />
    </svg>
  );
}
