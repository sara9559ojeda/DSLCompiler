import { useMemo } from "react";
import { createDefaultPipeline } from "@saramariaojeda9559/compiler-core";
import { useEditorStore } from "../state/useEditorStore.js";
import { DSL_PRESETS } from "../config/presets.config.js";
import { DEFAULT_DSL_SOURCE } from "../config/app.config.js";

const PRESET_SOURCES = new Set(DSL_PRESETS.map((preset) => preset.source));

/** Only ask before overwriting code the user actually wrote — swapping between presets or the default sample is free. */
function isUserWritten(source: string): boolean {
  return source.trim() !== "" && source !== DEFAULT_DSL_SOURCE && !PRESET_SOURCES.has(source);
}

export function PresetGallery(): JSX.Element {
  const source = useEditorStore((s) => s.source);
  const setSource = useEditorStore((s) => s.setSource);

  // Thumbnails are the presets' own compiled output, not separate artwork.
  const thumbnails = useMemo(() => {
    const pipeline = createDefaultPipeline();
    return new Map(DSL_PRESETS.map((preset) => [preset.id, pipeline.compile(preset.source).svg ?? ""]));
  }, []);

  const loadPreset = (presetSource: string): void => {
    if (isUserWritten(source) && !window.confirm("Esto reemplaza el código que escribiste. ¿Continuar?")) {
      return;
    }
    setSource(presetSource);
  };

  return (
    <div className="presets">
      <span className="presets__label">Plantillas</span>
      <ul className="presets__list">
        {DSL_PRESETS.map((preset) => {
          const isActive = source === preset.source;
          return (
            <li key={preset.id}>
              <button
                type="button"
                className={`preset-card${isActive ? " preset-card--active" : ""}`}
                onClick={() => loadPreset(preset.source)}
                aria-pressed={isActive}
              >
                <span
                  className="preset-card__thumb"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: thumbnails.get(preset.id) ?? "" }}
                />
                <span className="preset-card__name">{preset.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
