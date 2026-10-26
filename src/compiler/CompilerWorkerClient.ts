import type { CompileResult } from "@saramariaojeda9559/compiler-core";
import type { Inspection } from "./inspection.js";

export interface CompileOutput {
  readonly result: CompileResult;
  readonly inspection: Inspection;
}

interface WorkerResponse extends CompileOutput {
  readonly id: number;
}

/**
 * Request/response correlation over a single Worker, by id — a plain
 * transport with no opinion on staleness. Whether an older, superseded
 * response should still be applied is a UI policy decision, left to the
 * caller (see useCompilerSync.ts).
 */
export class CompilerWorkerClient {
  private nextId = 0;
  private readonly pending = new Map<number, (output: CompileOutput) => void>();

  constructor(private readonly worker: Worker) {
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handleMessage(event);
  }

  compile(source: string): Promise<CompileOutput> {
    const id = ++this.nextId;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ type: "compile", id, source });
    });
  }

  terminate(): void {
    this.worker.terminate();
  }

  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, result, inspection } = event.data;
    const resolve = this.pending.get(id);
    if (!resolve) return;
    this.pending.delete(id);
    resolve({ result, inspection });
  }
}
