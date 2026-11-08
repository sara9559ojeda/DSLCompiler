import { useMemo } from "react";
import { useCompileOutput } from "../compiler/sharedCompiler.js";
import { PLAYGROUND_EXAMPLES, defaultValues } from "./examples.js";
import { EyeMotif, StarMotif } from "./Motifs.js";

const SHOWCASE = PLAYGROUND_EXAMPLES[1]!; // the mandala: loops + groups, visibly "compiled"
const STAGES = ["Lexer", "Parser", "Semántico", "Optimizador", "SVG"] as const;

const STEPS = [
  { n: "01", word: "ESCRIBE", text: "Un lenguaje en español: variables, bucles, funciones, grupos y diagramas." },
  { n: "02", word: "COMPILA", text: "Lexer, parser, análisis semántico y optimizador convierten el texto en una escena." },
  { n: "03", word: "CREA", text: "La escena se dibuja como SVG limpio, listo para exportar o seguir editando a mano." },
] as const;

/**
 * SECTION 04 — HOW IT WORKS. A tall block with one sticky stage. Every moving
 * part is driven by the block's own CSS view timeline (`--how`), so the story
 * advances with the scroll position without a single scroll listener. Without
 * scroll-driven animation support the three steps simply stack, fully visible.
 */
export function HowItWorks(): JSX.Element {
  const source = useMemo(() => SHOWCASE.build(defaultValues(SHOWCASE)), []);
  const { output } = useCompileOutput(source, 0);
  const svg = output?.result.success ? (output.result.svg ?? "") : "";
  const snippet = source.split("\n").slice(0, 16).join("\n");

  return (
    <section className="how" id="como-funciona" aria-label="Cómo funciona: escribe, compila, crea">
      <div className="how__pin">
        <div className="how__progress" aria-hidden="true" />
        <p className="kicker how__kicker">04 — Cómo funciona</p>

        <ol className="how__words">
          {STEPS.map((step, index) => (
            <li key={step.n} className={`how__word how__word--${index + 1}`}>
              <span className="how__n">{step.n}</span>
              <span className="how__label">{step.word}</span>
              <span className="how__text">{step.text}</span>
            </li>
          ))}
        </ol>

        <div className="how__art" aria-hidden={false}>
          <pre className="how__code how__code--1" aria-label="Código de ejemplo">
            <code>{snippet}</code>
          </pre>

          <ol className="how__pipeline how__pipeline--2" aria-label="Etapas del compilador">
            {STAGES.map((stage, index) => (
              <li key={stage} style={{ ["--i" as string]: index }}>
                {stage}
              </li>
            ))}
          </ol>

          <div className="how__result how__result--3">
            {svg ? <div className="how__svg" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="Resultado compilado" /> : null}
          </div>

          <EyeMotif className="how__eye" />
          <StarMotif className="how__star" />
        </div>
      </div>
    </section>
  );
}
