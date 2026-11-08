import { useMemo, useRef, useState } from "react";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { useCompileOutput } from "../compiler/sharedCompiler.js";
import { EditorialHeading } from "./EditorialHeading.js";
import { ScrollReveal } from "./ScrollReveal.js";
import { StarMotif } from "./Motifs.js";
import { PLAYGROUND_EXAMPLES, defaultValues, type ControlValues, type PlaygroundExample } from "./examples.js";
import { openInStudio } from "./openInStudio.js";

function totalMs(timings: readonly { readonly durationMs: number }[]): string {
  return timings.reduce((sum, t) => sum + t.durationMs, 0).toFixed(1);
}

/**
 * SECTION 02 — FROM CODE TO ART. A real playground: the sliders rewrite the
 * `const` lines of a DSL program, the text area is editable, and the picture is
 * compiled by compiler-core in the shared Web Worker (the same one the studio
 * uses). Nothing on the right is pre-rendered.
 */
export function InteractivePlayground(): JSX.Element {
  const [example, setExample] = useState<PlaygroundExample>(PLAYGROUND_EXAMPLES[0]!);
  const [values, setValues] = useState<ControlValues>(() => defaultValues(PLAYGROUND_EXAMPLES[0]!));
  const [source, setSource] = useState(() => PLAYGROUND_EXAMPLES[0]!.build(defaultValues(PLAYGROUND_EXAMPLES[0]!)));
  const [edited, setEdited] = useState(false);
  const { output, pending } = useCompileOutput(source);

  // Keep the last picture that compiled so a typo doesn't blank the canvas.
  const lastSvg = useRef<string>("");
  if (output?.result.success && output.result.svg) lastSvg.current = output.result.svg;

  const errors = useMemo(() => output?.result.diagnostics.filter((d) => d.severity === "error") ?? [], [output]);

  const chooseExample = (next: PlaygroundExample): void => {
    const nextValues = defaultValues(next);
    setExample(next);
    setValues(nextValues);
    setSource(next.build(nextValues));
    setEdited(false);
  };

  const changeValue = (key: string, value: number | string): void => {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    setSource(example.build(nextValues));
    setEdited(false);
  };

  return (
    <section className="playground" id="del-codigo-al-arte" aria-labelledby="playground-title">
      <div className="playground__head">
        <p className="kicker">02 — Del código al arte</p>
        <EditorialHeading
          lines={["Cambia un número.", <em key="a">Cambia la obra.</em>]}
          className="playground__title"
        />
        <p className="playground__lead" id="playground-title">
          Esto no es una captura: es el compilador real corriendo en tu navegador. Mueve los controles o edita el código.
        </p>
        <StarMotif className="playground__star" />
      </div>

      <div className="playground__tabs" role="tablist" aria-label="Ejemplos">
        {PLAYGROUND_EXAMPLES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === example.id}
            className={`chip${item.id === example.id ? " chip--on" : ""}`}
            onClick={() => chooseExample(item)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="playground__stage">
        <ScrollReveal effect="from-left" className="pg-code">
          <div className="pg-code__bar">
            <span className="pg-code__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="pg-code__file">{example.id}.dsl{edited ? " · editado" : ""}</span>
          </div>
          <label className="visually-hidden" htmlFor="pg-source">
            Código DSL editable
          </label>
          <textarea
            id="pg-source"
            className="pg-code__area"
            value={source}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={14}
            onChange={(event) => {
              setSource(event.target.value);
              setEdited(true);
            }}
          />
          <div className={`pg-code__status${errors.length > 0 ? " pg-code__status--error" : ""}`} role="status" aria-live="polite">
            {pending ? (
              <span className="pg-code__compiling">Compilando…</span>
            ) : errors.length > 0 ? (
              <>
                <TriangleAlert size={14} aria-hidden="true" />
                <span>
                  Línea {errors[0]!.position.line}: {errors[0]!.message}
                </span>
              </>
            ) : (
              <>
                <Check size={14} aria-hidden="true" />
                <span>Compila · {output ? totalMs(output.inspection.timings) : "—"} ms · en un Web Worker</span>
              </>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal effect="from-right" className="pg-canvas">
          <div
            className={`pg-canvas__svg${pending ? " is-pending" : ""}`}
            // The compiler's own sanitized SVG output (same as the studio preview and preset thumbnails).
            dangerouslySetInnerHTML={{ __html: lastSvg.current }}
            role="img"
            aria-label={`Resultado compilado del ejemplo ${example.name}`}
          />
          {!lastSvg.current ? <p className="pg-canvas__empty">Compilando el primer dibujo…</p> : null}
          <div className="pg-controls">
            <p className="pg-controls__blurb">{example.blurb}</p>
            {example.controls.map((control) =>
              control.kind === "number" ? (
                <label className="pg-field" key={control.key}>
                  <span className="pg-field__label">
                    {control.label}
                    <output>{String(values[control.key])}</output>
                  </span>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={Number(values[control.key])}
                    onChange={(event) => changeValue(control.key, Number(event.target.value))}
                  />
                </label>
              ) : (
                <fieldset className="pg-field pg-field--choice" key={control.key}>
                  <legend className="pg-field__label">{control.label}</legend>
                  <div className="pg-choice">
                    {control.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`chip chip--sm${values[control.key] === option ? " chip--on" : ""}`}
                        aria-pressed={values[control.key] === option}
                        onClick={() => changeValue(control.key, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ),
            )}
            <button type="button" className="btn btn--primary btn--sm" onClick={() => openInStudio(source)}>
              Abrir en el estudio <ArrowRight className="btn__arrow" size={16} aria-hidden="true" />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
