import { describe, expect, it } from "vitest";
import { CompilerWorkerClient } from "../src/compiler/CompilerWorkerClient.js";

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  public readonly sent: { id: number; type: string; source: string }[] = [];

  postMessage(message: { id: number; type: string; source: string }): void {
    this.sent.push(message);
  }

  respond(id: number, result: unknown): void {
    this.onmessage?.({ data: { id, result, inspection: { tokens: [] } } } as MessageEvent);
  }

  terminate(): void {}
}

describe("CompilerWorkerClient", () => {
  it("resolves the matching promise when the worker responds", async () => {
    const worker = new FakeWorker();
    const client = new CompilerWorkerClient(worker as unknown as Worker);

    const promise = client.compile("c1 = crear_circulo(radio=1, x=0, y=0);");
    expect(worker.sent).toHaveLength(1);
    expect(worker.sent[0]?.type).toBe("compile");

    worker.respond(worker.sent[0]!.id, { success: true, svg: "<svg></svg>", diagnostics: [] });

    await expect(promise).resolves.toMatchObject({ result: { success: true }, inspection: { tokens: [] } });
  });

  it("correlates concurrent requests by id instead of resolving in send order", async () => {
    const worker = new FakeWorker();
    const client = new CompilerWorkerClient(worker as unknown as Worker);

    const firstPromise = client.compile("a");
    const secondPromise = client.compile("b");
    const [firstId, secondId] = worker.sent.map((m) => m.id);

    worker.respond(secondId!, { success: true, svg: "second", diagnostics: [] });
    worker.respond(firstId!, { success: true, svg: "first", diagnostics: [] });

    await expect(firstPromise).resolves.toMatchObject({ result: { svg: "first" } });
    await expect(secondPromise).resolves.toMatchObject({ result: { svg: "second" } });
  });
});
