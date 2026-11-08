import { ArrowDown, ArrowRight } from "lucide-react";
import { EditorialHeading } from "./EditorialHeading.js";
import { HeroSculpture } from "./HeroSculpture.js";
import { HalfDiscMotif, SquiggleMotif, StarMotif } from "./Motifs.js";
import { navigate } from "../routing/useHashRoute.js";

/** SECTION 01 — THE LIVING CANVAS. */
export function LandingHero(): JSX.Element {
  return (
    <section className="lhero" id="lienzo" aria-labelledby="lhero-title">
      {/* background planes: three depths that drift at different speeds as the hero scrolls away */}
      <div className="lhero__planes" aria-hidden="true">
        <StarMotif className="lhero__plane lhero__plane--star" />
        <HalfDiscMotif className="lhero__plane lhero__plane--half" />
        <SquiggleMotif className="lhero__plane lhero__plane--squiggle" />
      </div>

      <div className="lhero__copy">
        <p className="lhero__eyebrow">
          <span>CREATIVE CODING</span>
          <span aria-hidden="true">/</span>
          <span>DSL 2.0</span>
        </p>
        <EditorialHeading
          as="h1"
          reveal="load"
          className="lhero__title"
          lines={[
            "El código",
            "también es",
            <em key="arte" className="lhero__em">
              arte
              <svg className="lhero__underline" viewBox="0 0 300 24" aria-hidden="true" focusable="false" preserveAspectRatio="none">
                <path d="M4 16 C 60 2, 110 24, 170 10 S 270 6, 296 14" />
              </svg>
            </em>,
          ]}
        />
        <p className="lhero__lead" id="lhero-title">
          Escribe figuras en un lenguaje propio y míralas compilarse en vivo. Bucles, grupos, diagramas que se
          ordenan solos y una IA que traduce tus ideas a código.
        </p>
        <div className="lhero__actions">
          <a
            className="btn btn--primary"
            href="#/estudio"
            onClick={(event) => {
              event.preventDefault();
              navigate("studio");
            }}
          >
            Empezar a crear <ArrowRight className="btn__arrow" size={18} aria-hidden="true" />
          </a>
          <a className="btn btn--ghost" href="#del-codigo-al-arte">
            Explorar el lenguaje <ArrowRight className="btn__arrow" size={18} aria-hidden="true" />
          </a>
        </div>
      </div>

      <HeroSculpture />

      <a className="lhero__scroll" href="#del-codigo-al-arte">
        <span>Scroll</span>
        <ArrowDown size={16} aria-hidden="true" />
      </a>
    </section>
  );
}
