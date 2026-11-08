import { useEffect, useRef, useState } from "react";
import { CompileCancelledError, CompilerWorkerClient, type CompileOutput } from "./CompilerWorkerClient.js";
import { COMPILE_TIMEOUT_MS } from "../config/compile.config.js";

/**
 * One Web Worker shared by every landing section that compiles (playground,
 * gallery, AI example): the same worker/compiler-core the studio uses, created
 * on first use and terminated when the last consumer unmounts.
 */
let client: CompilerWorkerClient | null = null;
let consumers = 0;

function createWorker(): Worker {
  return new Worker(new URL("./compiler.worker.ts", import.meta.url), { type: "module" });
}

function acquire(): CompilerWorkerClient {
  consumers += 1;
  // No `cancelAfterMs` here: that option means "a newer request replaces a slow one", which is right for the
  // single-consumer editor but wrong when several sections share this worker (one section's request would
  // cancel another's). The hard timeout still stops a runaway program and re-sends whatever queued behind it.
  client ??= new CompilerWorkerClient(createWorker(), { createWorker, timeoutMs: COMPILE_TIMEOUT_MS });
  return client;
}

function release(): void {
  consumers -= 1;
  if (consumers <= 0) {
    client?.terminate();
    client = null;
    consumers = 0;
  }
}

export interface CompileState {
  readonly output: CompileOutput | null;
  readonly pending: boolean;
}

/** Compiles `source` in the worker, debounced; keeps the previous output visible while a newer one is computed. */
export function useCompileOutput(source: string, debounceMs = 250): CompileState {
  const [state, setState] = useState<CompileState>({ output: null, pending: true });
  const latest = useRef(0);

  useEffect(() => {
    acquire();
    return release;
  }, []);

  useEffect(() => {
    const requestId = ++latest.current;
    setState((current) => ({ ...current, pending: true }));
    const timer = window.setTimeout(() => {
      const current = client;
      if (!current) return;
      current
        .compile(source)
        .then((output) => {
          if (requestId === latest.current) setState({ output, pending: false });
        })
        .catch((error: unknown) => {
          if (!(error instanceof CompileCancelledError) && requestId === latest.current) {
            setState((previous) => ({ ...previous, pending: false }));
          }
        });
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [source, debounceMs]);

  return state;
}

/** Compiles a fixed list of sources (gallery thumbnails), one after another, off the main thread. */
export function useCompileBatch(sources: readonly string[]): ReadonlyMap<string, CompileOutput> {
  const [results, setResults] = useState<ReadonlyMap<string, CompileOutput>>(new Map());

  useEffect(() => {
    const worker = acquire();
    let cancelled = false;
    void (async () => {
      for (const source of sources) {
        try {
          const output = await worker.compile(source);
          if (cancelled) return;
          setResults((previous) => new Map(previous).set(source, output));
        } catch {
          // a failed thumbnail stays empty; the card still opens in the studio
        }
      }
    })();
    return () => {
      cancelled = true;
      release();
    };
    // `sources` is a module-level constant list in every caller: the batch runs once per mount.
  }, []);

  return results;
}
