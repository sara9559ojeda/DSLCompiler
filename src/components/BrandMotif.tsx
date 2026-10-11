/**
 * Decorative brand illustration — bold outlines, an eye motif (the compiler
 * "sees" the DSL and renders it), ray-bursts and organic blobs, in the
 * project's saturated palette. Purely decorative (aria-hidden): confined to
 * the header logomark and the hero banner per the maximalist-but-disciplined
 * brief — never appears inside the functional workspace.
 */

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function BrandMark(): JSX.Element {
  return (
    <svg
      className="site-header__mark"
      width="28"
      height="18"
      viewBox="0 0 32 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 10C6 2 12 1 16 1C20 1 26 2 31 10C26 18 20 19 16 19C12 19 6 18 1 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="16" cy="10" r="5.5" fill="#ff9f17" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="10" r="2.1" fill="currentColor" />
    </svg>
  );
}

export function HeroMotif(): JSX.Element {
  return (
    <svg
      className="hero__motif"
      viewBox="0 0 280 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ray-burst behind the main eye */}
      <g stroke="#06232d" strokeWidth="2.5" strokeLinejoin="round">
        {RAY_ANGLES.map((angle) => (
          <path
            key={angle}
            d="M140 85 Q152 55 140 25 Q128 55 140 85 Z"
            fill="#fff4de"
            transform={`rotate(${angle} 140 130)`}
          />
        ))}
      </g>

      {/* Coral organic blob, back-left */}
      <path
        d="M-10 190C10 150 55 150 70 175C85 200 70 235 35 240C0 245 -30 230 -10 190Z"
        fill="#e93622"
        stroke="#06232d"
        strokeWidth="2.5"
      />

      {/* Secondary cropped eye, top-right */}
      <g transform="translate(205 -12) rotate(18)">
        <path
          d="M0 16C9 2 24 -4 40 2C56 8 62 20 58 30C50 44 30 46 16 38C4 31 -5 24 0 16Z"
          fill="#fff4de"
          stroke="#06232d"
          strokeWidth="2.5"
        />
        <circle cx="34" cy="18" r="11" fill="#19a9d2" stroke="#06232d" strokeWidth="2.5" />
        <circle cx="34" cy="18" r="4.5" fill="#06232d" />
      </g>

      {/* Dot cluster */}
      <g fill="#ff9f17">
        <circle cx="26" cy="36" r="4" />
        <circle cx="42" cy="36" r="4" />
        <circle cx="58" cy="36" r="4" />
        <circle cx="26" cy="52" r="4" />
        <circle cx="42" cy="52" r="4" />
      </g>

      {/* Main eye */}
      <path
        d="M30 130C50 85 95 70 140 70C185 70 230 85 250 130C230 175 185 190 140 190C95 190 50 175 30 130Z"
        fill="#fff4de"
        stroke="#06232d"
        strokeWidth="3"
      />
      <circle cx="140" cy="130" r="38" fill="#19a9d2" stroke="#06232d" strokeWidth="3" />
      <circle cx="140" cy="130" r="16" fill="#06232d" />
      <circle cx="129" cy="118" r="6" fill="#fff4de" />
    </svg>
  );
}
