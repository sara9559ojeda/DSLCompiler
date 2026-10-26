import { useEffect, useRef } from "react";
import { CompilerWorkerClient } from "./CompilerWorkerClient.js";
import { useEditorStore } from "../state/useEditorStore.js";
import { COMPILE_DEBOUNCE_MS } from "../config/app.config.js";

/**
 * Keeps `result`/`isCompiling` in sync with `source`: debounced, and run
 * entirely inside a Web Worker. This is the whole INP strategy for typing —
 * a keystroke only ever updates `source` (cheap), so its own interaction
 * finishes instantly regardless of how large the DSL program is; the actual
 * parse/compile happens later, off the main thread, and is applied only if
 * it's still the most recent request by the time it comes back.
 */
export function useCompilerSync(): void {
  const source = useEditorStore((s) => s.source);
  const setResult = useEditorStore((s) => s.setResult);
  const setIsCompiling = useEditorStore((s) => s.setIsCompiling);
  const clientRef = useRef<CompilerWorkerClient | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL("./compiler.worker.ts", import.meta.url), { type: "module" });
    clientRef.current = new CompilerWorkerClient(worker);
    return () => {
      clientRef.current?.terminate();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const client = clientRef.current;
      if (!client) return;

      const requestId = ++latestRequestRef.current;
      setIsCompiling(true);

      client.compile(source).then(({ result, inspection }) => {
        if (requestId !== latestRequestRef.current) return; // a newer keystroke superseded this one
        setResult(result, inspection);
        setIsCompiling(false);
      });
    }, COMPILE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [source, setResult, setIsCompiling]);
}
