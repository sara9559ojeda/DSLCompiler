/**
 * The brand's geometric vocabulary as reusable SVG motifs: concentric eyes,
 * stars, squiggles, dots, half discs. Flat fills from the palette tokens and
 * an ink outline — the same language as the 3D sculpture and the app's
 * illustrations. Purely decorative: aria-hidden.
 */
interface MotifProps {
  readonly className?: string;
}

export function EyeMotif({ className }: MotifProps): JSX.Element {
  return (
    <svg className={`motif motif--eye ${className ?? ""}`} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle className="m-fill-cream m-ink" cx="100" cy="100" r="94" />
      <circle className="m-fill-blue m-ink" cx="100" cy="100" r="74" />
      <circle className="m-fill-night m-ink" cx="100" cy="100" r="56" />
      <circle className="m-fill-orange m-ink" cx="100" cy="100" r="40" />
      <circle className="m-fill-night m-ink" cx="100" cy="100" r="22" />
      <circle className="m-fill-cream" cx="108" cy="92" r="6" />
    </svg>
  );
}

export function StarMotif({ className, points = 5 }: MotifProps & { readonly points?: number }): JSX.Element {
  const outer = 46;
  const inner = points === 5 ? 20 : 26;
  const path = Array.from({ length: points * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    return `${i === 0 ? "M" : "L"}${(50 + Math.cos(angle) * radius).toFixed(1)} ${(50 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
  return (
    <svg className={`motif motif--star ${className ?? ""}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="m-ink" d={`${path} Z`} strokeLinejoin="round" />
    </svg>
  );
}

export function SquiggleMotif({ className }: MotifProps): JSX.Element {
  return (
    <svg className={`motif motif--squiggle ${className ?? ""}`} viewBox="0 0 220 40" aria-hidden="true" focusable="false">
      <path className="m-stroke" d="M6 28 Q 22 4 38 20 T 70 20 T 102 20 T 134 20 T 166 20 T 198 20 T 214 12" />
    </svg>
  );
}

export function DotsMotif({ className }: MotifProps): JSX.Element {
  return (
    <svg className={`motif motif--dots ${className ?? ""}`} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      {Array.from({ length: 25 }, (_, i) => (
        <circle key={i} cx={12 + (i % 5) * 24} cy={12 + Math.floor(i / 5) * 24} r="5" />
      ))}
    </svg>
  );
}

export function HalfDiscMotif({ className }: MotifProps): JSX.Element {
  return (
    <svg className={`motif motif--half ${className ?? ""}`} viewBox="0 0 120 64" aria-hidden="true" focusable="false">
      <path className="m-ink" d="M6 60 a54 54 0 0 1 108 0 z" strokeLinejoin="round" />
    </svg>
  );
}

export function RingMotif({ className }: MotifProps): JSX.Element {
  return (
    <svg className={`motif motif--ring ${className ?? ""}`} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle className="m-ink m-ring" cx="60" cy="60" r="46" fill="none" />
    </svg>
  );
}
