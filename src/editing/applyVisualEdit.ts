import { planEdit, type EditRequest } from "@saramariaojeda9559/compiler-core";
import { applyTextChanges } from "../editor/editorBridge.js";
import { useEditorStore } from "../state/useEditorStore.js";

/** Why a request wasn't applied: a refusal from the planner (already stored for the inspector), or the scene being stale. */
export type ApplyOutcome = "applied" | "refused" | "stale" | "no-editor";

/**
 * The single door every visual change goes through (canvas drag, resize,
 * keyboard, inspector field, delete): plan against the scene that was
 * compiled from the CURRENT text, then apply the minimal changes to Monaco as
 * one undo step. If the text has moved on since that compile the offsets would
 * be wrong, so it declines instead of guessing.
 */
export function applyVisualEdit(request: EditRequest): ApplyOutcome {
  const { source, compiledSource, inspection, setEditRefusal } = useEditorStore.getState();
  if (!inspection || compiledSource !== source) return "stale";

  const plan = planEdit(source, inspection.scene, request);
  if (!plan.ok) {
    setEditRefusal(plan);
    return "refused";
  }
  setEditRefusal(null);
  return applyTextChanges(plan.changes) ? "applied" : "no-editor";
}
