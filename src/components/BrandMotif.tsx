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

/** A bold eye, the shape every other motif in this file is built from. */
function Eye({
  cx,
  cy,
  r,
  iris = "#19a9d2",
  sclera = "#fff4de",
}: {
  cx: number;
  cy: number;
  r: number;
  iris?: string;
  sclera?: string;
}): JSX.Element {
  const w = r * 2.3;
  const h = r * 1.35;
  return (
    <g>
      <path
        d={`M${cx - w} ${cy}C${cx - w * 0.55} ${cy - h} ${cx - w * 0.2} ${cy - h} ${cx} ${cy - h}C${cx + w * 0.2} ${cy - h} ${cx + w * 0.55} ${cy - h} ${cx + w} ${cy}C${cx + w * 0.55} ${cy + h} ${cx + w * 0.2} ${cy + h} ${cx} ${cy + h}C${cx - w * 0.2} ${cy + h} ${cx - w * 0.55} ${cy + h} ${cx - w} ${cy}Z`}
        fill={sclera}
        stroke="#06232d"
        strokeWidth={r * 0.08}
      />
      <circle cx={cx} cy={cy} r={r * 0.55} fill={iris} stroke="#06232d" strokeWidth={r * 0.08} />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#06232d" />
      <circle cx={cx - r * 0.16} cy={cy - r * 0.16} r={r * 0.09} fill="#fff4de" />
    </g>
  );
}

function Heart({ cx, cy, s, fill }: { cx: number; cy: number; s: number; fill: string }): JSX.Element {
  return (
    <path
      d="M0 11C-11 -2 -28 -1 -28 13C-28 26 -11 36 0 48C11 36 28 26 28 13C28 -1 11 -2 0 11Z"
      fill={fill}
      stroke="#06232d"
      strokeWidth={s * 2.4}
      transform={`translate(${cx} ${cy}) scale(${s})`}
    />
  );
}

/**
 * Full-bleed hero illustration — covers the entire banner edge to edge
 * (via preserveAspectRatio="xMidYMid slice", like background-size: cover),
 * not a small icon tucked in a corner. The headline sits in an opaque box
 * on top of it for contrast, same move the reference composition makes.
 */
export function HeroIllustration(): JSX.Element {
  return (
    <svg
      className="hero__illustration"
      viewBox="0 0 1600 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Big organic color blocks bleeding off the edges */}
      <path
        d="M-40 60C120 -60 340 -40 380 110C420 260 280 340 150 320C20 300 -140 260 -140 160C-140 120 -100 90 -40 60Z"
        fill="#087ac0"
        stroke="#06232d"
        strokeWidth="4"
        opacity="0.9"
      />
      <path
        d="M1250 -40C1420 -60 1660 10 1640 140C1620 260 1460 260 1360 220C1260 180 1150 140 1160 60C1165 20 1190 -20 1250 -40Z"
        fill="#ff9f17"
        stroke="#06232d"
        strokeWidth="4"
        opacity="0.9"
      />
      <path
        d="M-60 560C60 480 220 500 260 610C300 720 180 800 40 800C-40 800 -120 760 -120 680C-120 630 -110 590 -60 560Z"
        fill="#e93622"
        stroke="#06232d"
        strokeWidth="4"
        opacity="0.9"
      />
      <path
        d="M1340 540C1460 480 1620 520 1630 630C1640 730 1520 800 1400 790C1300 782 1220 720 1240 640C1250 600 1280 565 1340 540Z"
        fill="#19a9d2"
        stroke="#06232d"
        strokeWidth="4"
        opacity="0.85"
      />

      {/* Ray-burst behind the main eye */}
      <g stroke="#06232d" strokeWidth="3" strokeLinejoin="round">
        {RAY_ANGLES.map((angle) => (
          <path
            key={angle}
            d="M800 460 Q824 410 800 360 Q776 410 800 460 Z"
            fill="#fff4de"
            opacity="0.9"
            transform={`rotate(${angle} 800 560)`}
          />
        ))}
      </g>

      <Eye cx={800} cy={560} r={95} />
      <Eye cx={1310} cy={210} r={55} iris="#ff9f17" />
      <Eye cx={190} cy={640} r={46} iris="#e93622" />

      <Heart cx={420} cy={150} s={1.3} fill="#e93622" />
      <Heart cx={1180} cy={470} s={1} fill="#ff9f17" />
      <Heart cx={1000} cy={160} s={0.8} fill="#fff4de" />

      {/* Eyelash squiggle accents */}
      <path
        d="M620 240C640 225 660 225 680 240"
        stroke="#fff4de"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M980 650C1000 635 1020 635 1040 650"
        stroke="#fff4de"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Dot clusters */}
      <g fill="#ff9f17">
        <circle cx="520" cy="420" r="9" />
        <circle cx="552" cy="420" r="9" />
        <circle cx="536" cy="448" r="9" />
      </g>
      <g fill="#19a9d2">
        <circle cx="1120" cy="620" r="7" />
        <circle cx="1146" cy="620" r="7" />
        <circle cx="1120" cy="644" r="7" />
        <circle cx="1146" cy="644" r="7" />
      </g>

      {/* Oval pills, like scattered confetti */}
      <ellipse cx="300" cy="300" rx="34" ry="16" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(-18 300 300)" />
      <ellipse cx="1420" cy="420" rx="30" ry="14" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(12 1420 420)" />
      <ellipse cx="900" cy="700" rx="26" ry="13" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(-8 900 700)" />

      {/* Ring accents */}
      <circle cx="1060" cy="330" r="22" fill="none" stroke="#fff4de" strokeWidth="3" opacity="0.6" />
      <circle cx="430" cy="600" r="16" fill="none" stroke="#fff4de" strokeWidth="3" opacity="0.6" />
    </svg>
  );
}
