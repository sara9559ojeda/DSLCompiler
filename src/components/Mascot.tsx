/**
 * The guide's face — a tight, bold avatar badge (colored circle backdrop +
 * face), designed to read clearly even at a small 64-72px size next to the
 * speech bubble. Same stroke/palette language as BrandMotif. Purely
 * decorative (aria-hidden); GuideBubble supplies the actual text.
 */
export function Mascot(): JSX.Element {
  return (
    <svg className="mascot" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Badge backdrop — gives the character its own color so it reads as an avatar, not a loose sketch. */}
      <circle cx="60" cy="60" r="56" fill="#ff9f17" stroke="#06232d" strokeWidth="4" />

      {/* Beret */}
      <path
        d="M26 46C26 20 48 6 66 8C86 10 96 28 90 44C90 44 98 42 100 50C101 56 94 60 86 57"
        fill="#087ac0"
        stroke="#06232d"
        strokeWidth="4"
      />
      <circle cx="86" cy="48" r="6" fill="#fff4de" stroke="#06232d" strokeWidth="3" />

      {/* Head */}
      <circle cx="58" cy="68" r="36" fill="#ffcf8a" stroke="#06232d" strokeWidth="4" />

      {/* Eyes */}
      <circle cx="44" cy="62" r="12" fill="#fff4de" stroke="#06232d" strokeWidth="3" />
      <circle cx="45" cy="63" r="5.5" fill="#19a9d2" stroke="#06232d" strokeWidth="2" />
      <circle cx="72" cy="65" r="9.5" fill="#fff4de" stroke="#06232d" strokeWidth="3" />
      <circle cx="73" cy="66" r="4.5" fill="#e93622" stroke="#06232d" strokeWidth="2" />

      {/* Mustache */}
      <path
        d="M34 90C42 80 52 88 58 86C64 88 74 80 82 90C74 100 66 92 58 94C50 92 42 100 34 90Z"
        fill="#06232d"
      />
    </svg>
  );
}
