import { HeroMotif } from "./BrandMotif.js";

/** Small standalone accent shapes scattered across the hero's full-bleed width on wide screens — otherwise the navy banner reads as empty once the centered copy/motif no longer fill it. Purely decorative. */
function HeroScatter(): JSX.Element {
  return (
    <>
      <svg className="hero__scatter hero__scatter--a" viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r="18" fill="none" stroke="#fff4de" strokeWidth="3" opacity="0.5" />
      </svg>
      <svg className="hero__scatter hero__scatter--b" viewBox="0 0 60 60" aria-hidden="true">
        <g fill="#ff9f17" opacity="0.8">
          <circle cx="12" cy="12" r="5" />
          <circle cx="30" cy="12" r="5" />
          <circle cx="21" cy="28" r="5" />
        </g>
      </svg>
      <svg className="hero__scatter hero__scatter--c" viewBox="0 0 80 80" aria-hidden="true">
        <path
          d="M8 44C16 24 40 16 56 28C72 40 68 64 48 70C28 76 0 64 8 44Z"
          fill="none"
          stroke="#19a9d2"
          strokeWidth="3"
          opacity="0.55"
        />
      </svg>
      <svg className="hero__scatter hero__scatter--d" viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z"
          fill="#e93622"
          opacity="0.6"
        />
      </svg>
    </>
  );
}

export function Hero(): JSX.Element {
  return (
    <section className="hero">
      <HeroScatter />
      <div className="hero__inner">
        <div className="hero__copy">
          <span className="hero__eyebrow">DSL → SVG / PNG</span>
          <h1 className="hero__title">Dale forma a tus imágenes</h1>
          <p className="hero__subtitle">
            Escribe figuras en un lenguaje propio y mira el resultado compilarse en vivo, o describilo en
            lenguaje natural y dejá que la IA escriba el DSL por vos.
          </p>
        </div>
        <HeroMotif />
      </div>
    </section>
  );
}
