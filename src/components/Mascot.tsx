/**
 * The guide's face — same bold-outline, flat-color language as BrandMotif,
 * built as a standalone illustrated character instead of an abstract shape.
 * Purely decorative (aria-hidden); GuideBubble supplies the actual text.
 */
export function Mascot(): JSX.Element {
  return (
    <svg className="mascot" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Beret */}
      <path
        d="M30 46C30 20 58 6 76 10C98 15 106 34 98 46C104 42 112 44 112 52C112 60 100 62 92 58"
        fill="#087ac0"
        stroke="#06232d"
        strokeWidth="3"
      />
      <circle cx="97" cy="50" r="6" fill="#ff9f17" stroke="#06232d" strokeWidth="2.5" />

      {/* Head */}
      <circle cx="68" cy="78" r="46" fill="#ffcf8a" stroke="#06232d" strokeWidth="3.5" />

      {/* Ear */}
      <circle cx="22" cy="80" r="10" fill="#ffcf8a" stroke="#06232d" strokeWidth="3" />

      {/* Eyes */}
      <g>
        <circle cx="52" cy="72" r="14" fill="#fff4de" stroke="#06232d" strokeWidth="3" />
        <circle cx="52" cy="73" r="7" fill="#19a9d2" stroke="#06232d" strokeWidth="2" />
        <circle cx="52" cy="73" r="3" fill="#06232d" />
      </g>
      <g>
        <circle cx="86" cy="76" r="11" fill="#fff4de" stroke="#06232d" strokeWidth="3" />
        <circle cx="86" cy="77" r="5.5" fill="#e93622" stroke="#06232d" strokeWidth="2" />
        <circle cx="86" cy="77" r="2.3" fill="#06232d" />
      </g>

      {/* Mustache */}
      <path
        d="M44 102C52 94 60 100 68 98C76 100 84 94 92 102C86 112 78 106 68 108C58 106 50 112 44 102Z"
        fill="#06232d"
      />

      {/* Hand holding a pencil */}
      <g>
        <path d="M100 118L128 86" stroke="#06232d" strokeWidth="6" strokeLinecap="round" />
        <path d="M100 118L128 86" stroke="#ff9f17" strokeWidth="3" strokeLinecap="round" />
        <path d="M124 82L134 72L138 76L128 86Z" fill="#e93622" stroke="#06232d" strokeWidth="2.5" />
        <circle cx="104" cy="116" r="11" fill="#fff4de" stroke="#06232d" strokeWidth="3" />
      </g>
    </svg>
  );
}
