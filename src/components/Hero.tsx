import { ArrowRight } from "lucide-react";
import { HeroIllustration } from "./BrandMotif.js";
import { HeroCharacter } from "./HeroCharacter.js";

export function Hero(): JSX.Element {
  return (
    <section className="hero" id="top">
      <HeroIllustration />
      <div className="hero__inner">
        <div className="hero__textbox">
          <span className="hero__eyebrow">DSL → SVG / PNG</span>
          <h1 className="hero__title">Dale forma a tus imágenes</h1>
          <p className="hero__subtitle">
            Escribe figuras en un lenguaje propio y mira el resultado compilarse en vivo, o describilo en
            lenguaje natural y dejá que la IA escriba el DSL por vos.
          </p>
          <a className="button button--primary hero__cta" href="#proyecto">
            Empezar a compilar <ArrowRight size={16} />
          </a>
        </div>
        <HeroCharacter />
      </div>
    </section>
  );
}
