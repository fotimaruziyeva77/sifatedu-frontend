/**
 * "Sifat-bot" — SIFAT Kids maskoti. Sof SVG: rasm yuklanmaydi, rang temaga moslashadi.
 * Harakat (tebranish, ko'z qisish) CSS'da va `prefers-reduced-motion` da o'chadi.
 */
export function KidsBot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 170" role="img" aria-hidden className={className}>
      <g className="kids-bot">
        {/* Antenna */}
        <line
          x1="80"
          y1="18"
          x2="80"
          y2="38"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle className="kids-bot__lamp" cx="80" cy="14" r="8" />
        {/* Bosh */}
        <rect x="30" y="36" width="100" height="78" rx="30" className="kids-bot__head" />
        <rect x="44" y="54" width="72" height="40" rx="18" className="kids-bot__face" />
        <g className="kids-bot__eyes">
          <circle cx="64" cy="73" r="7" />
          <circle cx="96" cy="73" r="7" />
        </g>
        <path
          d="M68 86 Q80 94 92 86"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Quloqlar */}
        <rect x="18" y="62" width="14" height="26" rx="7" className="kids-bot__ear" />
        <rect x="128" y="62" width="14" height="26" rx="7" className="kids-bot__ear" />
        {/* Tana */}
        <rect x="48" y="118" width="64" height="40" rx="16" className="kids-bot__body" />
        <circle cx="80" cy="138" r="8" className="kids-bot__heart" />
        {/* Qo'l silkitadi */}
        <path
          className="kids-bot__wave"
          d="M112 126 q20 -6 22 -26"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M48 126 q-16 6 -18 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
