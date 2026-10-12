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
        <pattern id="backdrop-tile" width="220" height="220" patternUnits="userSpaceOnUse">
          <circle cx="26" cy="30" r="5" fill="var(--palette-orange)" opacity="0.8" />
          <circle cx="42" cy="30" r="5" fill="var(--palette-orange)" opacity="0.8" />
          <circle cx="34" cy="44" r="5" fill="var(--palette-orange)" opacity="0.8" />

          <circle cx="168" cy="52" r="13" fill="none" stroke="var(--color-text)" strokeWidth="2.5" opacity="0.4" />

          <path
            d="M118 110 L123 124 L137 129 L123 134 L118 148 L113 134 L99 129 L113 124 Z"
            fill="var(--palette-coral)"
            opacity="0.55"
          />

          <path
            d="M28 146C45 132 64 140 65 159C66 178 46 187 30 180C14 173 11 160 28 146Z"
            fill="none"
            stroke="var(--palette-cyan)"
            strokeWidth="2.5"
            opacity="0.55"
          />

          <path
            d="M180 170C190 164 200 169 199 180C198 191 187 195 179 190C171 185 170 176 180 170Z"
            fill="var(--palette-blue)"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#backdrop-tile)" />
    </svg>
  );
}
