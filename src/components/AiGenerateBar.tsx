import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { useEditorStore } from "../state/useEditorStore.js";
import { MAX_ASSIST_PROMPT_LENGTH } from "../api/IAiAssistClient.js";

const PLACEHOLDER = 'Describe un diagrama… por ejemplo "gato", "una casa con un árbol al lado"';

/**
 * Quick entry point to the assistant: it hands the description to the AI panel,
 * which generates, compiles and shows the result as a proposal to accept or
 * reject. Nothing is written to the editor from here.
 */
export function AiGenerateBar(): JSX.Element {
  const requestAssistant = useEditorStore((s) => s.requestAssistant);
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    requestAssistant({ mode: "generate", prompt: trimmed });
    setPrompt("");
    document.getElementById("asistente")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  };

  return (
    <form className="ai-bar" onSubmit={handleSubmit}>
      <Sparkles size={16} className="ai-bar__icon" aria-hidden />
      <input
        type="text"
        className="ai-bar__input"
        placeholder={PLACEHOLDER}
        value={prompt}
        maxLength={MAX_ASSIST_PROMPT_LENGTH}
        onChange={(event) => setPrompt(event.target.value)}
        aria-label="Descripción para generar un diagrama con IA"
      />
      <button type="submit" className="button" disabled={!prompt.trim()}>
        <Sparkles size={16} />
        Generar
      </button>
    </form>
  );
}
