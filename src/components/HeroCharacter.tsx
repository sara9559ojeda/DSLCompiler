/**
 * The hero's signature character — a painter: split two-tone face, a
 * two-tone beret, a bold mustache, a brush in one hand and a palette in
 * the other. Lives as a fixed figure in the hero illustration (not a
 * popup), same stroke/palette language as BrandMotif. Purely decorative
 * (aria-hidden).
 */
export function HeroCharacter(): JSX.Element {
  return (
    <svg className="hero__character" viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Palette hand (drawn first, sits behind the body) */}
      <g>
        <path d="M152 196C160 212 150 230 178 232C202 234 214 214 206 196C198 178 162 180 152 196Z" fill="#ffcf8a" stroke="#06232d" strokeWidth="4" />
        <circle cx="166" cy="200" r="7" fill="#ff9f17" stroke="#06232d" strokeWidth="2" />
        <circle cx="184" cy="194" r="7" fill="#19a9d2" stroke="#06232d" strokeWidth="2" />
        <circle cx="198" cy="206" r="7" fill="#e93622" stroke="#06232d" strokeWidth="2" />
        <circle cx="180" cy="216" r="7" fill="#fff4de" stroke="#06232d" strokeWidth="2" />
      </g>

      {/* Brush hand */}
      <g>
        <path d="M40 210L14 176" stroke="#06232d" strokeWidth="9" strokeLinecap="round" />
        <path d="M40 210L14 176" stroke="#ffcf8a" strokeWidth="5" strokeLinecap="round" />
        <path d="M8 170L2 150L18 156L22 172Z" fill="#e93622" stroke="#06232d" strokeWidth="3" />
        <circle cx="44" cy="214" r="13" fill="#ffcf8a" stroke="#06232d" strokeWidth="4" />
      </g>

      {/* Body */}
      <path d="M60 232C60 206 84 196 110 196C136 196 160 206 160 232V260H60Z" fill="#087ac0" stroke="#06232d" strokeWidth="4" />

      {/* Beret, two-tone */}
      <path d="M46 56C46 22 76 4 110 6C146 8 170 30 164 54" fill="#087ac0" stroke="#06232d" strokeWidth="4" />
      <path d="M110 6C144 8 170 30 164 54C168 50 182 50 184 62C186 74 170 80 158 74" fill="#e93622" stroke="#06232d" strokeWidth="4" />

      {/* Head, split two-tone face */}
      <path d="M110 46A64 64 0 0 1 110 174Z" fill="#fff4de" stroke="#06232d" strokeWidth="4" />
      <path d="M110 46A64 64 0 0 0 110 174Z" fill="#ff9f17" stroke="#06232d" strokeWidth="4" />

      {/* Visor accents above each eye */}
      <path d="M62 92A24 24 0 0 1 106 88" fill="none" stroke="#e93622" strokeWidth="8" strokeLinecap="round" />
      <path d="M118 90A20 20 0 0 1 156 96" fill="none" stroke="#19a9d2" strokeWidth="8" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="84" cy="110" r="20" fill="#fff4de" stroke="#06232d" strokeWidth="4" />
      <circle cx="85" cy="112" r="9" fill="#06232d" />
      <circle cx="81" cy="108" r="3" fill="#fff4de" />
      <circle cx="136" cy="112" r="14" fill="#ffcf8a" stroke="#06232d" strokeWidth="4" />
      <circle cx="137" cy="114" r="6" fill="#06232d" />

      {/* Mustache */}
      <path
        d="M66 148C80 134 96 146 110 142C124 146 140 134 154 148C144 168 128 154 110 158C92 154 76 168 66 148Z"
        fill="#06232d"
      />
    </svg>
  );
}
