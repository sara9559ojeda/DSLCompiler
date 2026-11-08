import { useEditorStore } from "../state/useEditorStore.js";
import { navigate } from "../routing/useHashRoute.js";

/** Loads a program into the shared editor store and switches to the studio — no compile logic is duplicated here. */
export function openInStudio(source: string): void {
  useEditorStore.getState().setSource(source);
  navigate("studio");
}

/** Hands a prompt to the real assistant (the studio's AI panel consumes the request) and opens the studio. */
export function askAssistantInStudio(prompt: string): void {
  useEditorStore.getState().requestAssistant({ mode: "generate", prompt });
  navigate("studio");
}
