import { ArrowUpRight } from "lucide-react";
import { useCompileBatch } from "../compiler/sharedCompiler.js";
import { DSL_PRESETS } from "../config/presets.config.js";
import { EditorialHeading } from "./EditorialHeading.js";
import { GALLERY_ITEMS } from "./galleryItems.js";
import { openInStudio } from "./openInStudio.js";
import { SquiggleMotif } from "./Motifs.js";

const SOURCES = GALLERY_ITEMS.map((item) => DSL_PRESETS.find((preset) => preset.id === item.presetId)?.source ?? "");

/**
 * SECTION 03 — MADE WITH DSL. An asymmetric editorial grid of real presets.
 * Each picture is compiled in the Web Worker from the very source that "Abrir
 * en el editor" loads, so the gallery can't drift from the language.
 */
export function ExampleGallery(): JSX.Element {
  const compiled = useCompileBatch(SOURCES);

  return (
    <section className="gallery" id="galeria" aria-labelledby="gallery-title">
      <div className="gallery__intro">
        <p className="kicker">03 — Hecho con DSL</p>
        <EditorialHeading lines={["Hecho", "con", <em key="d">DSL</em>]} className="gallery__title" />
        <p className="gallery__lead" id="gallery-title">
          Cada pieza es un programa de unas pocas líneas. Elige una y ábrela en el editor con su código fuente.
        </p>
        <SquiggleMotif className="gallery__squiggle" />
      </div>

      <ul className="gallery__grid">
        {GALLERY_ITEMS.map((item, index) => {
          const preset = DSL_PRESETS.find((candidate) => candidate.id === item.presetId);
          if (!preset) return null;
          const svg = compiled.get(SOURCES[index]!)?.result.svg ?? "";
          return (
            <li key={item.presetId} className={`gcard gcard--${item.span} gcard--${item.tone}`}>
              <button type="button" className="gcard__button" onClick={() => openInStudio(preset.source)}>
                <span className="gcard__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
                <span className="gcard__meta">
                  <span className="gcard__category">{item.category}</span>
                  <span className="gcard__name">{preset.name}</span>
                </span>
                <span className="gcard__reveal">
                  <span className="gcard__features">{item.features.join(" · ")}</span>
                  <span className="gcard__open">
                    Abrir en el editor <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </span>
                <span className="visually-hidden">
                  {preset.name}: {item.category}. Abrir en el editor con su código fuente.
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
