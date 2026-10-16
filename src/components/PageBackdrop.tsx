/**
 * Full-page decorative layer: flowing wavy ribbons (like a marbled wood-
 * grain pattern), tiled behind every panel. Panels have opaque surfaces,
 * so this only ever shows through in the margins and gutters between
 * them — never under editor/preview content. Fixed + z-index: 0, with
 * .app-shell at z-index: 1, keeps it out of the way of interaction
 * (pointer-events: none) and of scroll (it never moves).
 *
 * Each wave is a single cubic-bezier period (0→400, rise then fall back
 * to its own baseline) so the tile repeats seamlessly — the right edge
 * of one tile always meets the left edge of the next at the same y and
 * slope.
 */
function wavePath(y: number, amplitude: number): string {
  return `M0 ${y}C50 ${y - amplitude} 150 ${y - amplitude} 200 ${y}C250 ${y + amplitude} 350 ${y + amplitude} 400 ${y}`;
}

const WAVES = [
  { y: 36, amplitude: 16, color: "var(--palette-cream)", width: 24, opacity: 0.55 },
  { y: 84, amplitude: 20, color: "var(--palette-cyan)", width: 26, opacity: 0.32 },
  { y: 132, amplitude: 15, color: "var(--palette-orange)", width: 20, opacity: 0.28 },
  { y: 180, amplitude: 19, color: "var(--palette-coral)", width: 18, opacity: 0.22 },
];

export function PageBackdrop(): JSX.Element {
  return (
    <svg className="page-backdrop" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="backdrop-tile" width="400" height="220" patternUnits="userSpaceOnUse">
          {WAVES.map((wave) => (
            <path
              key={wave.y}
              d={wavePath(wave.y, wave.amplitude)}
              fill="none"
              stroke={wave.color}
              strokeWidth={wave.width}
              strokeLinecap="round"
              opacity={wave.opacity}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#backdrop-tile)" />
    </svg>
  );
}
