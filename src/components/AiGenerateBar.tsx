import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useEditorStore } from "../state/useEditorStore.js";
import { GatewayAiSuggestClient } from "../api/GatewayAiSuggestClient.js";
import type { IAiSuggestClient } from "../api/IAiSuggestClient.js";

const aiSuggestClient: IAiSuggestClient = new GatewayAiSuggestClient();
const PLACEHOLDER = 'Describe un diagrama… por ejemplo "gato", "una casa con un árbol al lado"';

/**
 * Generates DSL from a natural-language description (via ai-assist) and
 * loads it straight into the editor through the existing store — reuses
 * the same debounced Web Worker compile pipeline as typing by hand, so
 * nothing about the preview/diagnostics flow needed to change.
 */
export function AiGenerateBar(): JSX.Element {
  const setSource = useEditorStore((s) => s.setSource);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [note, setNote] = useState<{ kind: "error" | "warning"; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;

    setNote(null);
    setIsGenerating(true);
    try {
      const result = await aiSuggestClient.suggest(trimmed);
      setSource(result.dslSource);
      if (!result.valid) {
        setNote({
          kind: "warning",
          message: "La IA generó el diagrama pero quedó con errores — revisalos abajo y ajustá el código a mano.",
        });
      }
    } catch (error) {
      setNote({
        kind: "error",
        message: error instanceof Error ? error.message : "No se pudo generar el diagrama.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form className="ai-bar" onSubmit={(event) => void handleSubmit(event)}>
      <Sparkles size={16} className="ai-bar__icon" aria-hidden />
      <input
        type="text"
        className="ai-bar__input"
        placeholder={PLACEHOLDER}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        disabled={isGenerating}
        aria-label="Descripción para generar un diagrama con IA"
      />
      <button type="submit" className="button" disabled={isGenerating || !prompt.trim()}>
        {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
        Generar
      </button>
      {note ? <span className={`ai-bar__note ai-bar__note--${note.kind}`}>{note.message}</span> : null}
    </form>
  );
}
