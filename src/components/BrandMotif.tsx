/**
 * The DSL Studio logomark: an eye — the compiler "sees" the DSL and renders
 * it. It uses currentColor for the outline so it works on any background.
 * The larger illustrative motifs live in landing/Motifs.tsx.
 */
export function BrandMark(): JSX.Element {
  return (
    <svg className="brand-mark" width="28" height="18" viewBox="0 0 32 20" fill="none" aria-hidden="true">
      <path
        d="M1 10C6 2 12 1 16 1C20 1 26 2 31 10C26 18 20 19 16 19C12 19 6 18 1 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="16" cy="10" r="5.5" fill="#ff9c1a" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="10" r="2.1" fill="currentColor" />
    </svg>
  );
}
