import { ArrowRight } from "lucide-react";
import { EditorialHeading } from "./EditorialHeading.js";
import { DotsMotif, EyeMotif, SquiggleMotif, StarMotif } from "./Motifs.js";
import { navigate } from "../routing/useHashRoute.js";

/** SECTION 06 — FINAL CTA. */
export function FinalCTA(): JSX.Element {
  return (
    <section className="final" id="crear" aria-labelledby="final-title">
      <div className="final__art" aria-hidden="true">
        <EyeMotif className="final__eye final__eye--big" />
        <EyeMotif className="final__eye final__eye--small" />
        <StarMotif className="final__star" />
        <DotsMotif className="final__dots" />
        <SquiggleMotif className="final__squiggle" />
      </div>
      <p className="kicker final__kicker">06 — Tu turno</p>
      <EditorialHeading
        lines={["Tu imaginación,", <em key="c">compilada.</em>]}
        className="final__title"
      />
      <p className="final__lead" id="final-title">
        Abre el estudio, escribe la primera línea y mira cómo se dibuja.
      </p>
      <a
        className="btn btn--cream btn--xl"
        href="#/estudio"
        onClick={(event) => {
          event.preventDefault();
          navigate("studio");
        }}
      >
        Abrir el estudio <ArrowRight className="btn__arrow" size={22} aria-hidden="true" />
      </a>
    </section>
  );
}
