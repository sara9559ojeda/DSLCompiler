import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useCompileOutput } from "../compiler/sharedCompiler.js";
import { checkLanguageVersion, type VersionStatus } from "../api/languageVersion.js";
import { EditorialHeading } from "./EditorialHeading.js";
import { ScrollReveal } from "./ScrollReveal.js";
import { AI_EXAMPLE } from "./aiExample.js";
import { askAssistantInStudio, openInStudio } from "./openInStudio.js";

function BackendNote({ status }: { readonly status: VersionStatus }): JSX.Element {
  if (status.kind === "checking") return <p className="ai__note">Comprobando el servidor…</p>;
  if (status.kind === "unknown") {
    return (
      <p className="ai__note ai__note--off">
        El servidor no responde ahora mismo. El compilador local sigue funcionando; el asistente necesita el servidor.
      </p>
    );
  }
  return (
    <p className="ai__note">
      Servidor en línea (lenguaje {status.kind === "match" ? status.version : status.backend}). El asistente responde
      solo si el servidor tiene configurada una <code>ANTHROPIC_API_KEY</code>; si no, el estudio te avisa.
    </p>
  );
}

/**
 * SECTION 05 — CREATIVE AI. The three-step flow is shown with a sample that is
 * explicitly labelled as an example (hand-written, not a live model answer).
 * The validation badge and the picture ARE real: the sample code is compiled
 * by the real compiler. "Probar con IA" sends the visitor's own prompt to the
 * real assistant in the studio.
 */
export function CreativeAISection(): JSX.Element {
  const { output, pending } = useCompileOutput(AI_EXAMPLE.code, 0);
  const [prompt, setPrompt] = useState("");
  const [backend, setBackend] = useState<VersionStatus>({ kind: "checking" });

  useEffect(() => {
    let active = true;
    void checkLanguageVersion().then((status) => {
      if (active) setBackend(status);
    });
    return () => {
      active = false;
    };
  }, []);

  const diagnostics = output?.result.diagnostics ?? [];
  const valid = Boolean(output?.result.success) && diagnostics.every((d) => d.severity !== "error");
  const svg = output?.result.svg ?? "";

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (prompt.trim()) askAssistantInStudio(prompt.trim());
  };

  return (
    <section className="ai" id="ia" aria-labelledby="ai-title">
      <div className="ai__head">
        <p className="kicker">05 — IA creativa</p>
        <EditorialHeading lines={["Describe una idea.", <em key="p">Convierte palabras en código.</em>]} className="ai__title" />
        <p className="ai__lead" id="ai-title">
          El asistente escribe DSL, el compilador lo valida y tú decides si lo aplicas: nada reemplaza tu código sin tu visto bueno.
        </p>
      </div>

      <div className="ai__flow">
        <ScrollReveal className="ai-card ai-card--prompt">
          <span className="ai-card__step">1 · Lenguaje natural</span>
          <p className="ai-card__prompt">“{AI_EXAMPLE.prompt}”</p>
          <span className="ai-card__tag">Ejemplo ilustrativo</span>
        </ScrollReveal>

        <ScrollReveal className="ai-card ai-card--code">
          <span className="ai-card__step">2 · Código DSL propuesto</span>
          <pre className="ai-card__pre">
            <code>{AI_EXAMPLE.code}</code>
          </pre>
          <span className="ai-card__tag">Escrito a mano, no es una respuesta en vivo</span>
        </ScrollReveal>

        <ScrollReveal className="ai-card ai-card--result">
          <span className="ai-card__step">3 · Resultado validado</span>
          <div className="ai-card__svg" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="Resultado compilado del código de ejemplo" />
          <p className={`ai-card__valid${valid ? " is-valid" : ""}`} role="status">
            {pending ? (
              "Validando con el compilador…"
            ) : valid ? (
              <>
                <Check size={15} aria-hidden="true" /> Compila sin errores (validado por el compilador real)
              </>
            ) : (
              "El ejemplo no compiló"
            )}
          </p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => openInStudio(AI_EXAMPLE.code)}>
            Abrir este ejemplo <ArrowRight className="btn__arrow" size={16} aria-hidden="true" />
          </button>
        </ScrollReveal>
      </div>

      <form className="ai__try" onSubmit={submit}>
        <label className="ai__label" htmlFor="ai-prompt">
          <Sparkles size={16} aria-hidden="true" /> Prueba con tu propia idea
        </label>
        <div className="ai__row">
          <input
            id="ai-prompt"
            className="ai__input"
            value={prompt}
            maxLength={1000}
            placeholder="Una casa con techo rojo y un sol"
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={prompt.trim() === ""}>
            Generar en el estudio <ArrowRight className="btn__arrow" size={18} aria-hidden="true" />
          </button>
        </div>
        <BackendNote status={backend} />
      </form>
    </section>
  );
}
