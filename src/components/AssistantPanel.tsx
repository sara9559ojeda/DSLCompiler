import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Square } from "lucide-react";
import { GatewayAiAssistClient } from "../api/GatewayAiAssistClient.js";
import {
  AssistError,
  MAX_ASSIST_PROMPT_LENGTH,
  type AssistMode,
  type AssistResponse,
  type IAiAssistClient,
} from "../api/IAiAssistClient.js";
import { collapseDiff, diffLines, hasChanges } from "../ai/lineDiff.js";
import { replaceAllText } from "../editor/editorBridge.js";
import { useEditorStore } from "../state/useEditorStore.js";

const defaultClient: IAiAssistClient = new GatewayAiAssistClient();

const MODES: readonly { readonly id: AssistMode; readonly label: string; readonly placeholder: string }[] = [
  { id: "generate", label: "Generar", placeholder: 'Describe lo que quieres, por ejemplo "una casa con un árbol" o "un diagrama de flujo de login"' },
  { id: "modify", label: "Modificar", placeholder: 'Qué cambiar del código actual, por ejemplo "hazlo azul y añade 5 círculos más"' },
  { id: "explain", label: "Explicar", placeholder: "Opcional: una pregunta sobre el código (o déjalo vacío para una explicación general)" },
];

interface Proposal {
  readonly response: Extract<AssistResponse, { dslSource: string }>;
  /** The editor text the proposal was made against; accepting is only safe while it is unchanged. */
  readonly base: string;
}

/**
 * The AI side panel. It never writes to the editor on its own: a generate or
 * modify answer comes back as a *proposal* (already compiled by the backend,
 * with the compiler's own preview) that the user reviews as a diff and then
 * accepts or rejects. Accepting is a single undoable edit.
 */
export function AssistantPanel({ client = defaultClient }: { readonly client?: IAiAssistClient }): JSX.Element {
  const source = useEditorStore((s) => s.source);
  const diagnostics = useEditorStore((s) => s.result?.diagnostics);
  const requested = useEditorStore((s) => s.assistantRequest);
  const consumeRequest = useEditorStore((s) => s.consumeAssistantRequest);

  const [mode, setMode] = useState<AssistMode>("generate");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const hasCode = source.trim() !== "";
  const errorCount = diagnostics?.filter((d) => d.severity === "error").length ?? 0;
  const modeInfo = MODES.find((candidate) => candidate.id === mode)!;
  const needsCode = mode !== "generate";
  const canRun = !running && (mode === "explain" || prompt.trim() !== "") && (!needsCode || hasCode);

  const run = async (nextMode: AssistMode, nextPrompt: string): Promise<void> => {
    if (running) return;
    const base = useEditorStore.getState().source;
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);
    setError(null);
    setProposal(null);
    setExplanation(null);
    try {
      const response = await client.assist(
        { mode: nextMode, prompt: nextPrompt.trim(), ...(nextMode === "generate" ? {} : { source: base }) },
        controller.signal,
      );
      if (response.mode === "explain") setExplanation(response.explanation);
      else setProposal({ response, base });
    } catch (caught) {
      if (caught instanceof AssistError && caught.kind === "cancelled") setError("Cancelaste la solicitud.");
      else setError(caught instanceof Error ? caught.message : "No se pudo completar la solicitud.");
    } finally {
      controllerRef.current = null;
      setRunning(false);
    }
  };

  // Other parts of the page (the quick "Generar" bar) hand a request to the panel.
  useEffect(() => {
    if (!requested) return;
    setMode(requested.mode);
    setPrompt(requested.prompt);
    consumeRequest();
    void run(requested.mode, requested.prompt);
  }, [requested]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const stale = proposal !== null && proposal.base !== source;
  // A trailing newline is not a change worth showing; accepting keeps whichever ending the user's code had.
  const ops = useMemo(
    () => (proposal ? diffLines(proposal.base.replace(/\n+$/, ""), proposal.response.dslSource.replace(/\n+$/, "")) : []),
    [proposal],
  );
  const { hunks, skippedAfter } = useMemo(() => collapseDiff(ops), [ops]);

  const accept = (): void => {
    if (!proposal || stale) return;
    const endsWithNewline = proposal.base.endsWith("\n");
    const next = proposal.response.dslSource.replace(/\n+$/, "");
    replaceAllText(endsWithNewline ? `${next}\n` : next);
    setProposal(null);
    setPrompt("");
  };

  return (
    <section className="assistant" aria-label="Asistente IA">
      <div className="assistant__modes" role="tablist" aria-label="Qué quieres hacer">
        {MODES.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={mode === candidate.id}
            className={`assistant__mode${mode === candidate.id ? " assistant__mode--active" : ""}`}
            onClick={() => setMode(candidate.id)}
            disabled={running}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <form
        className="assistant__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canRun) void run(mode, prompt);
        }}
      >
        <label htmlFor="assistant-prompt" className="visually-hidden">
          Instrucción para el asistente
        </label>
        <textarea
          id="assistant-prompt"
          className="assistant__prompt"
          rows={3}
          maxLength={MAX_ASSIST_PROMPT_LENGTH}
          placeholder={modeInfo.placeholder}
          value={prompt}
          disabled={running}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && canRun) void run(mode, prompt);
          }}
        />
        <div className="assistant__actions">
          <span className="assistant__count" aria-hidden="true">
            {prompt.length}/{MAX_ASSIST_PROMPT_LENGTH}
          </span>
          {running ? (
            <button type="button" className="button button--secondary" onClick={() => controllerRef.current?.abort()}>
              <Square size={14} /> Cancelar
            </button>
          ) : null}
          <button type="submit" className="button" disabled={!canRun}>
            {running ? <Loader2 size={16} className="spin" /> : <Bot size={16} />}
            {running ? "Trabajando…" : modeInfo.label}
          </button>
        </div>
        {needsCode && !hasCode ? <p className="assistant__hint">Escribe algo de código en el editor primero.</p> : null}
        {mode === "explain" && errorCount > 0 && !running ? (
          <p className="assistant__hint">
            El programa tiene {errorCount} {errorCount === 1 ? "error" : "errores"}: la explicación los incluirá.
          </p>
        ) : null}
      </form>

      <div aria-live="polite" className="assistant__result">
        {running ? <p className="assistant__status">El asistente propone y el compilador valida cada intento…</p> : null}
        {error ? (
          <p className="assistant__error" role="alert">
            {error}
          </p>
        ) : null}

        {explanation !== null ? <div className="assistant__explanation">{explanation}</div> : null}

        {proposal ? (
          <div className="assistant__proposal">
            <p className={`assistant__badge assistant__badge--${proposal.response.valid ? "ok" : "bad"}`}>
              {proposal.response.valid
                ? `Compila correctamente · ${proposal.response.attempts.length} ${proposal.response.attempts.length === 1 ? "intento" : "intentos"}`
                : `No compila (${proposal.response.diagnostics.filter((d) => d.severity === "error").length} errores tras ${proposal.response.attempts.length} intentos)`}
            </p>

            {proposal.response.svg ? (
              <img
                className="assistant__preview"
                alt="Vista previa de la propuesta"
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(proposal.response.svg)}`}
              />
            ) : null}

            {!proposal.response.valid ? (
              <ul className="assistant__diagnostics">
                {proposal.response.diagnostics.slice(0, 5).map((d, index) => (
                  <li key={`${d.code}-${index}`}>
                    <code>{d.code}</code> línea {d.position.line}: {d.message}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="assistant__diff" role="group" aria-label="Cambios propuestos">
              {!hasChanges(ops) ? <p className="assistant__hint">La propuesta es idéntica al código actual.</p> : null}
              {hunks.map((hunk, hunkIndex) => (
                <div key={hunkIndex}>
                  {hunk.skippedBefore > 0 ? <div className="assistant__skip">… {hunk.skippedBefore} líneas sin cambios</div> : null}
                  {hunk.ops.map((op, index) => (
                    <div key={index} className={`assistant__line assistant__line--${op.type}`}>
                      <span aria-hidden="true">{op.type === "add" ? "+" : op.type === "del" ? "−" : " "}</span>
                      <span className="visually-hidden">{op.type === "add" ? "Añadida: " : op.type === "del" ? "Eliminada: " : ""}</span>
                      <code>{op.text || " "}</code>
                    </div>
                  ))}
                </div>
              ))}
              {skippedAfter > 0 ? <div className="assistant__skip">… {skippedAfter} líneas sin cambios</div> : null}
            </div>

            {stale ? (
              <p className="assistant__error" role="alert">
                El código cambió mientras tanto. Pide la propuesta de nuevo para no perder tus cambios.
              </p>
            ) : null}

            <div className="assistant__actions">
              <button type="button" className="button button--secondary" onClick={() => setProposal(null)}>
                Rechazar
              </button>
              <button type="button" className="button" disabled={stale || !hasChanges(ops)} onClick={accept}>
                {proposal.response.valid ? "Aceptar" : "Aplicar con errores"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
