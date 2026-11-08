/**
 * Static SVG version of the hero sculpture: used while the 3D chunk loads, when
 * WebGL is missing or the device is low-power, and for prefers-reduced-motion.
 * Same composition and flat palette as the 3D scene so swapping is not a jump.
 */
function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }): JSX.Element {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
  return <polygon points={points} fill={fill} stroke="#03141a" strokeWidth="5" strokeLinejoin="round" />;
}

export function SculptureFallback(): JSX.Element {
  return (
    <svg className="sculpture__fallback" viewBox="0 0 600 600" role="img" aria-label="Escultura de ojos concéntricos con formas geométricas flotantes">
      <g stroke="#03141a" strokeWidth="5">
        <g className="sculpture__fallback-eye">
          <circle cx="300" cy="300" r="190" fill="#fff2dc" />
          <circle cx="300" cy="300" r="148" fill="#087ebd" />
          <circle cx="300" cy="300" r="112" fill="#0b2e3a" />
          <circle cx="300" cy="300" r="80" fill="#ff9c1a" />
          <circle cx="300" cy="300" r="48" fill="#0b2e3a" />
          <circle cx="318" cy="282" r="12" fill="#fff2dc" stroke="none" />
        </g>
        <ellipse className="sculpture__fallback-ring" cx="300" cy="300" rx="270" ry="96" fill="none" stroke="#ff9c1a" strokeWidth="22" transform="rotate(-24 300 300)" />
        <ellipse cx="300" cy="300" rx="270" ry="96" fill="none" stroke="#03141a" strokeWidth="2" transform="rotate(-24 300 300)" opacity="0.5" />
        <circle cx="500" cy="470" r="52" fill="#f35ba5" />
        <path d="M70 470 a60 60 0 0 1 120 0 z" fill="#087ebd" />
        <rect x="455" y="80" width="62" height="62" fill="#fff2dc" transform="rotate(18 486 111)" />
        <g className="sculpture__fallback-star">
          <Star cx={110} cy={120} r={54} fill="#f13b2d" />
        </g>
        <circle cx="548" cy="290" r="26" fill="#fff2dc" />
        <circle cx="548" cy="290" r="14" fill="#087ebd" />
      </g>
    </svg>
  );
}
