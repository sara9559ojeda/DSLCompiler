/**
 * Decorative brand illustration — bold outlines, an eye motif (the compiler
 * "sees" the DSL and renders it), ray-bursts and organic blobs, in the
 * project's saturated palette. Purely decorative (aria-hidden): confined to
 * the header logomark and the hero banner per the maximalist-but-disciplined
 * brief — never appears inside the functional workspace.
 *
 * Every shape below was placed by hand with two rules: never let two shapes
 * sit close enough to overlap, and never let a shape share its color with
 * whatever's immediately next to it (including the stroke on bare navy —
 * a navy-on-navy outline reads as a dull gray smudge, not a ring).
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

function Star({ cx, cy, s, fill, rotate = 0 }: { cx: number; cy: number; s: number; fill: string; rotate?: number }): JSX.Element {
  return (
    <path
      d="M0 -30L9 -9L30 0L9 9L0 30L-9 9L-30 0L-9 -9Z"
      fill={fill}
      stroke="#06232d"
      strokeWidth={s * 2.2}
      transform={`translate(${cx} ${cy}) scale(${s}) rotate(${rotate})`}
    />
  );
}

const CONCENTRIC_LAYERS = [
  { scale: 1, fill: "#087ac0" },
  { scale: 0.78, fill: "#ff9f17" },
  { scale: 0.56, fill: "#e93622" },
  { scale: 0.36, fill: "#19a9d2" },
  { scale: 0.18, fill: "#fff4de" },
];

/** Nested organic rings, like the layered wavy-stripe pattern reference — a second motif "family" alongside the eyes/hearts/stars. */
function ConcentricBlob({ cx, cy, s }: { cx: number; cy: number; s: number }): JSX.Element {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {CONCENTRIC_LAYERS.map((layer) => (
        <path
          key={layer.scale}
          d="M0 -60C33 -55 60 -28 58 6C56 42 30 68 -8 65C-46 62 -68 30 -62 -6C-58 -32 -30 -64 0 -60Z"
          fill={layer.fill}
          stroke="#06232d"
          strokeWidth={2.5 / layer.scale}
          transform={`scale(${layer.scale})`}
        />
      ))}
    </g>
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
      {/* Big organic color blocks bleeding off the edges — one per corner,
          plus one small buffer blob at top-center so blue and orange never
          touch directly. */}
      <path
        d="M-40 60C120 -60 340 -40 380 110C420 260 280 340 150 320C20 300 -140 260 -140 160C-140 120 -100 90 -40 60Z"
        fill="#087ac0"
        stroke="#06232d"
        strokeWidth="4"
      />
      <path
        d="M1250 -40C1420 -60 1660 10 1640 140C1620 260 1460 260 1360 220C1260 180 1150 140 1160 60C1165 20 1190 -20 1250 -40Z"
        fill="#ff9f17"
        stroke="#06232d"
        strokeWidth="4"
      />
      <path
        d="M-60 560C60 480 220 500 260 610C300 720 180 800 40 800C-40 800 -120 760 -120 680C-120 630 -110 590 -60 560Z"
        fill="#e93622"
        stroke="#06232d"
        strokeWidth="4"
      />
      <path
        d="M1340 540C1460 480 1620 520 1630 630C1640 730 1520 800 1400 790C1300 782 1220 720 1240 640C1250 600 1280 565 1340 540Z"
        fill="#19a9d2"
        stroke="#06232d"
        strokeWidth="4"
      />
      <path
        d="M680 -30C740 -50 820 -30 820 20C820 65 760 85 710 75C660 65 610 35 620 0C624 -15 650 -22 680 -30Z"
        fill="#19a9d2"
        stroke="#06232d"
        strokeWidth="4"
        opacity="0.85"
      />

      {/* Wavy ribbon in the blue/cyan top-left zone — stays clear of the orange corner. */}
      <path
        d="M-20 180C120 120 260 220 360 180C460 140 480 60 580 90"
        stroke="#087ac0"
        strokeWidth="42"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
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
      <Eye cx={800} cy={560} r={95} iris="#19a9d2" />

      {/* Secondary eyes — each iris picked to contrast with whatever blob/
          neighbor it sits closest to, never repeating it. */}
      <Eye cx={1310} cy={210} r={55} iris="#e93622" />
      <Eye cx={190} cy={640} r={46} iris="#19a9d2" />
      <Eye cx={300} cy={440} r={36} iris="#ff9f17" />
      <Eye cx={1230} cy={660} r={42} iris="#ff9f17" />

      <ConcentricBlob cx={1030} cy={195} s={1.2} />
      <ConcentricBlob cx={480} cy={640} s={0.75} />

      <Heart cx={450} cy={130} s={1.1} fill="#e93622" />
      <Heart cx={1180} cy={460} s={0.9} fill="#19a9d2" />
      <Heart cx={1490} cy={240} s={0.85} fill="#fff4de" />
      <Heart cx={110} cy={340} s={0.7} fill="#ff9f17" />
      <Heart cx={870} cy={90} s={0.7} fill="#ff9f17" />

      <Star cx={330} cy={200} s={0.7} fill="#19a9d2" rotate={10} />
      <Star cx={930} cy={260} s={0.6} fill="#e93622" rotate={-15} />
      <Star cx={1390} cy={560} s={0.7} fill="#fff4de" rotate={20} />
      <Star cx={65} cy={560} s={0.75} fill="#ff9f17" rotate={-8} />

      {/* Eyelash squiggles — sit on top of the colored blobs, where a dark
          outline reads clearly (never placed over bare navy). */}
      <path d="M620 240C640 225 660 225 680 240" stroke="#fff4de" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M1180 120C1198 106 1216 106 1234 120" stroke="#06232d" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M90 230C108 216 126 216 144 230" stroke="#06232d" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Dot clusters */}
      <g fill="#ff9f17">
        <circle cx="520" cy="420" r="9" />
        <circle cx="552" cy="420" r="9" />
        <circle cx="536" cy="448" r="9" />
      </g>
      <g fill="#fff4de">
        <circle cx="1120" cy="610" r="7" />
        <circle cx="1146" cy="610" r="7" />
        <circle cx="1120" cy="634" r="7" />
        <circle cx="1146" cy="634" r="7" />
      </g>
      <g fill="#e93622">
        <circle cx="240" cy="110" r="6" />
        <circle cx="262" cy="110" r="6" />
        <circle cx="251" cy="130" r="6" />
      </g>
      <g fill="#19a9d2">
        <circle cx="770" cy="190" r="7" />
        <circle cx="794" cy="190" r="7" />
        <circle cx="782" cy="212" r="7" />
      </g>

      {/* Oval pills — deliberately all cream, a neutral "confetti" accent
          that never competes for a color slot with its neighbors. */}
      <ellipse cx="300" cy="300" rx="34" ry="16" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(-18 300 300)" />
      <ellipse cx="1420" cy="420" rx="30" ry="14" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(12 1420 420)" />
      <ellipse cx="900" cy="700" rx="26" ry="13" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(-8 900 700)" />
      <ellipse cx="700" cy="60" rx="24" ry="12" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(20 700 60)" />
      <ellipse cx="40" cy="480" rx="22" ry="11" fill="#fff4de" stroke="#06232d" strokeWidth="3" transform="rotate(10 40 480)" />

      {/* Ring accents — fully opaque cream, always against bare navy. A
          translucent stroke here blended into a dull gray smudge instead
          of reading as a crisp ring. */}
      <circle cx="430" cy="580" r="16" fill="none" stroke="#fff4de" strokeWidth="4" />
      <circle cx="1480" cy="150" r="18" fill="none" stroke="#fff4de" strokeWidth="4" />
      <circle cx="1120" cy="230" r="13" fill="none" stroke="#fff4de" strokeWidth="4" />
    </svg>
  );
}
