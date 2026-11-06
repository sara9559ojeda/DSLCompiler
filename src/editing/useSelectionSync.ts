import { useEffect } from "react";
import { onUserCursor, selectSpan } from "../editor/editorBridge.js";
import { useEditorStore } from "../state/useEditorStore.js";
import { findTarget, findTargetAtOffset } from "./visualEdit.js";

/**
 * Keeps the selection the same in the editor and everywhere else:
 *  - the user moves the cursor onto a statement → that shape/group is selected;
 *  - a shape is selected on the canvas or inspector → its statement is
 *    highlighted in the editor.
 * Offsets only mean something for the text the scene was compiled from, so
 * cursor→selection is ignored while a newer edit is still compiling.
 */
export function useSelectionSync(editorReady: boolean): void {
  useEffect(() => {
    if (!editorReady) return undefined;
    return onUserCursor((offset) => {
      const { source, compiledSource, inspection, selectedId, select } = useEditorStore.getState();
      if (!inspection || source !== compiledSource) return;
      const id = findTargetAtOffset(inspection.scene, offset);
      if (id !== selectedId) select(id, "editor");
    });
  }, [editorReady]);

  useEffect(() => {
    if (!editorReady) return undefined;
    return useEditorStore.subscribe((state, previous) => {
      if (state.selectedId === previous.selectedId || state.selectedId === null || state.selectionOrigin === "editor") return;
      const target = state.inspection ? findTarget(state.inspection.scene, state.selectedId) : null;
      if (target?.origin) selectSpan(target.origin.statementSpan);
    });
  }, [editorReady]);

  // A selection that no longer exists after a successful recompile (its line was deleted) is dropped.
  useEffect(
    () =>
      useEditorStore.subscribe((state, previous) => {
        if (state.inspection === previous.inspection || state.selectedId === null || !state.result?.success) return;
        if (state.inspection && !findTarget(state.inspection.scene, state.selectedId)) state.select(null);
      }),
    [],
  );
}
