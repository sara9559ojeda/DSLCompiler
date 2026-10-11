import { HeroMotif } from "./BrandMotif.js";

export function Hero(): JSX.Element {
  return (
    <section className="hero">
      <div className="hero__copy">
        <span className="hero__eyebrow">DSL → SVG / PNG</span>
        <h1 className="hero__title">Dale forma a tus imágenes</h1>
        <p className="hero__subtitle">
          Escribe figuras en un lenguaje propio y mira el resultado compilarse en vivo, o describilo en
          lenguaje natural y dejá que la IA escriba el DSL por vos.
        </p>
      </div>
      <HeroMotif />
    </section>
  );
}
