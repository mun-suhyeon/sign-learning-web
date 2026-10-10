/** 디자인의 가는 화살표 (→ / ←) */
export function Arrow({ direction = 'right', className }: { direction?: 'right' | 'left'; className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="16"
      viewBox="0 0 28 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M0 8h26M19 1l7 7-7 7" />
    </svg>
  )
}
