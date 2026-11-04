export function Logo({
  withText = false,
  decorative = false,
  className = '',
}: {
  withText?: boolean
  decorative?: boolean
  className?: string
}) {
  const a11y = decorative ? ({ 'aria-hidden': true } as const) : ({ 'aria-label': 'ImCoding', role: 'img' } as const)
  return (
    <span {...a11y} className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg className="h-7 w-7 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect className="logo-bg" width="32" height="32" rx="8" />
        <path d="M10 21L16 11L22 18" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="21" r="3" fill="#FAF8F5" />
        <circle cx="16" cy="11" r="3" fill="#FAF8F5" />
        <circle cx="22" cy="18" r="4" fill="#C2410C" />
        <circle cx="22" cy="18" r="1.5" fill="#FAF8F5" />
      </svg>
      {withText && (
        <span aria-hidden="true" className="hidden font-display min-[480px]:inline text-lg font-extrabold tracking-tight text-ink">
          ImCoding
        </span>
      )}
    </span>
  )
}
