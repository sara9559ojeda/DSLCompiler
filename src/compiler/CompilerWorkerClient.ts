import type { CompileResult } from "@saramariaojeda9559/compiler-core";
import type { Inspection } from "./inspection.js";

export interface CompileOutput {
  readonly result: CompileResult;
  readonly inspection: Inspection;
}

interface WorkerResponse extends CompileOutput {
  readonly id: number;
}

/** A request that was abandoned because a newer one arrived while it was still running. */
export class CompileCancelledError extends Error {
  constructor() {
    super("Compilation cancelled");
    this.name = "CompileCancelledError";
  }
}

export interface WorkerClientOptions {
  /** Builds a fresh worker. Without it the client can't cancel or time out a running compile. */
  readonly createWorker?: () => Worker;
  /** A newer request replaces one that has been running longer than this (ms): the old worker is terminated. */
  readonly cancelAfterMs?: number;
  /** Hard limit for one compile (ms); past it the worker is terminated and the result is a diagnostic. */
  readonly timeoutMs?: number;
}

interface Pending {
  readonly id: number;
  readonly source: string;
  readonly resolve: (output: CompileOutput) => void;
  readonly reject: (error: Error) => void;
  readonly startedAt: number;
  readonly timer: ReturnType<typeof setTimeout> | undefined;
}

const emptyInspection: Inspection = {
  tokens: [],
  ast: null,
  scene: { canvas: { width: 800, height: 600 }, shapes: [], connections: [] },
  optimization: [],
  timings: [],
};

/**
 * Request/response correlation over a Worker, by id. Staleness stays a UI
 * policy (see useCompilerSync.ts), with one exception that can only be done
 * here: a compile is plain synchronous JavaScript inside the worker and can't
 * be interrupted from within, so *cancelling* a long one means terminating the
 * worker and starting a fresh one. That's what keeps a runaway program from
 * blocking the next keystroke's compile.
 */
export class CompilerWorkerClient {
  private nextId = 0;
  private readonly pending = new Map<number, Pending>();
  private worker: Worker;

  constructor(
    worker: Worker,
    private readonly options: WorkerClientOptions = {},
  ) {
    this.worker = worker;
    this.attach(worker);
  }

  compile(source: string): Promise<CompileOutput> {
    this.cancelStaleRequests();
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const { timeoutMs } = this.options;
      const timer =
        timeoutMs !== undefined && this.options.createWorker
          ? setTimeout(() => this.timeOut(id), timeoutMs)
          : undefined;
      this.pending.set(id, { id, source, resolve, reject, startedAt: Date.now(), timer });
      this.worker.postMessage({ type: "compile", id, source });
    });
  }

  terminate(): void {
    this.worker.terminate();
    for (const pending of this.pending.values()) clearTimeout(pending.timer);
    this.pending.clear();
  }

  private attach(worker: Worker): void {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handleMessage(event);
  }

  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, result, inspection } = event.data;
    const pending = this.pending.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(id);
    pending.resolve({ result, inspection });
  }

  /** Called before a new request: anything still running past `cancelAfterMs` is superseded, so its worker is replaced. */
  private cancelStaleRequests(): void {
    const { cancelAfterMs, createWorker } = this.options;
    if (cancelAfterMs === undefined || !createWorker || this.pending.size === 0) return;
    const now = Date.now();
    if (![...this.pending.values()].some((pending) => now - pending.startedAt > cancelAfterMs)) return;

    const cancelled = [...this.pending.values()];
    this.pending.clear();
    this.restartWorker();
    for (const pending of cancelled) {
      clearTimeout(pending.timer);
      pending.reject(new CompileCancelledError());
    }
  }

  private timeOut(id: number): void {
    const pending = this.pending.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(id);
    this.restartWorker();
    // Requests queued behind the stuck one died with the old worker: send them again.
    for (const other of this.pending.values()) this.worker.postMessage({ type: "compile", id: other.id, source: other.source });
    pending.resolve({
      result: {
        success: false,
        svg: null,
        diagnostics: [
          {
            severity: "error",
            code: "SEM-025",
            message: "La compilación tardó demasiado y se canceló.",
            position: { line: 1, column: 1 },
            suggestion: "Reduce las repeticiones o la recursión de tu programa.",
          },
        ],
      },
      inspection: emptyInspection,
    });
  }

  private restartWorker(): void {
    this.worker.terminate();
    this.worker = this.options.createWorker!();
    this.attach(this.worker);
  }
}
