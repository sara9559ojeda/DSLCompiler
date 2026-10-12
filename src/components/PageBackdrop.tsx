/**
 * Full-page decorative layer: a tiled scatter of brand shapes (dots, a
 * spark, a ring, a blob outline) sitting behind every panel. Panels have
 * opaque surfaces, so this only ever shows through in the margins and
 * gutters between them — never under editor/preview content. Fixed +
 * z-index: 0, with .app-shell at z-index: 1, keeps it out of the way of
 * interaction (pointer-events: none) and of scroll (it never moves).
 */
export function PageBackdrop(): JSX.Element {
  return (
    <svg className="page-backdrop" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="backdrop-tile" width="120" height="120" patternUnits="userSpaceOnUse">
          {/* Bold Memphis-style polka dots, two sizes */}
          <circle cx="60" cy="14" r="9" fill="var(--color-text)" opacity="0.14" />
          <circle cx="5" cy="100" r="13" fill="var(--color-text)" opacity="0.12" />

          <circle cx="14" cy="16" r="3" fill="var(--palette-orange)" opacity="0.8" />
          <circle cx="23" cy="16" r="3" fill="var(--palette-orange)" opacity="0.8" />
          <circle cx="18.5" cy="24" r="3" fill="var(--palette-orange)" opacity="0.8" />

          <circle cx="92" cy="28" r="7" fill="none" stroke="var(--color-text)" strokeWidth="2" opacity="0.4" />

          <path
            d="M67 60 L70 68 L78 71 L70 74 L67 82 L64 74 L56 71 L64 68 Z"
            fill="var(--palette-coral)"
            opacity="0.55"
          />

          <path
            d="M15 80C25 72 36 76 36 87C37 97 25 102 16 98C7 94 6 87 15 80Z"
            fill="none"
            stroke="var(--palette-cyan)"
            strokeWidth="2"
            opacity="0.55"
          />

          <path
            d="M97 92C103 88 109 91 108 98C108 104 101 106 97 103C93 100 92 96 97 92Z"
            fill="var(--palette-blue)"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#backdrop-tile)" />
    </svg>
  );
}
