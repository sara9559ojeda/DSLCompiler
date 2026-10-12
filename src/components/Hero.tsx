import { HeroIllustration } from "./BrandMotif.js";
import { HeroCharacter } from "./HeroCharacter.js";

export function Hero(): JSX.Element {
  return (
    <section className="hero">
      <HeroIllustration />
      <HeroCharacter />
      <div className="hero__inner">
        <div className="hero__textbox">
          <span className="hero__eyebrow">DSL → SVG / PNG</span>
          <h1 className="hero__title">Dale forma a tus imágenes</h1>
          <p className="hero__subtitle">
            Escribe figuras en un lenguaje propio y mira el resultado compilarse en vivo, o describilo en
            lenguaje natural y dejá que la IA escriba el DSL por vos.
          </p>
        </div>
      </div>
    </section>
  );
}
