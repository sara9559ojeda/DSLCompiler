import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantPanel } from "../src/components/AssistantPanel.js";
import { AssistError, type AssistRequest, type AssistResponse, type IAiAssistClient } from "../src/api/IAiAssistClient.js";
import { useEditorStore } from "../src/state/useEditorStore.js";
import * as bridge from "../src/editor/editorBridge.js";

const CURRENT = "// casa\nc1 = crear_circulo(radio=50, color=rojo, x=100, y=100);\n";
const PROPOSED = "// casa\nc1 = crear_circulo(radio=50, color=azul, x=100, y=100);\n";

class FakeClient implements IAiAssistClient {
  readonly requests: AssistRequest[] = [];
  constructor(private readonly respond: (request: AssistRequest, signal?: AbortSignal) => Promise<AssistResponse>) {}
  assist(request: AssistRequest, signal?: AbortSignal): Promise<AssistResponse> {
    this.requests.push(request);
    return this.respond(request, signal);
  }
}

const proposal = (overrides: Partial<Extract<AssistResponse, { dslSource: string }>> = {}): AssistResponse => ({
  mode: "modify",
  dslSource: PROPOSED,
  valid: true,
  diagnostics: [],
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
  attempts: [{ attempt: 1, valid: true, errors: 0 }],
  ...overrides,
});

const type = (text: string): void => {
  fireEvent.change(screen.getByLabelText(/Instrucción para el asistente/i), { target: { value: text } });
};

describe("AssistantPanel", () => {
  beforeEach(() => {
    useEditorStore.setState({ source: CURRENT, result: null, assistantRequest: null });
    vi.restoreAllMocks();
  });

  it("proposes a change as a diff and does NOT touch the editor until accepted", async () => {
    const replace = vi.spyOn(bridge, "replaceAllText").mockReturnValue(true);
    const client = new FakeClient(async () => proposal());
    render(<AssistantPanel client={client} />);

    fireEvent.click(screen.getByRole("tab", { name: "Modificar" }));
    type("hazlo azul");
    fireEvent.click(screen.getByRole("button", { name: "Modificar" }));

    await screen.findByText(/Compila correctamente/);
    expect(client.requests[0]).toEqual({ mode: "modify", prompt: "hazlo azul", source: CURRENT });
    expect(screen.getByText(/color=rojo/).closest(".assistant__line--del")).not.toBeNull();
    expect(screen.getByText(/color=azul/).closest(".assistant__line--add")).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
    expect(useEditorStore.getState().source).toBe(CURRENT);

    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(replace).toHaveBeenCalledWith(PROPOSED);
    expect(screen.queryByText(/Compila correctamente/)).toBeNull();
  });

  it("rejecting leaves everything as it was", async () => {
    const replace = vi.spyOn(bridge, "replaceAllText").mockReturnValue(true);
    render(<AssistantPanel client={new FakeClient(async () => proposal())} />);
    fireEvent.click(screen.getByRole("tab", { name: "Modificar" }));
    type("hazlo azul");
    fireEvent.click(screen.getByRole("button", { name: "Modificar" }));
    await screen.findByText(/Compila correctamente/);

    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(replace).not.toHaveBeenCalled();
    expect(useEditorStore.getState().source).toBe(CURRENT);
    expect(screen.queryByText(/Compila correctamente/)).toBeNull();
  });

  it("refuses to accept a proposal when the code changed in the meantime", async () => {
    const replace = vi.spyOn(bridge, "replaceAllText").mockReturnValue(true);
    render(<AssistantPanel client={new FakeClient(async () => proposal())} />);
    fireEvent.click(screen.getByRole("tab", { name: "Modificar" }));
    type("hazlo azul");
    fireEvent.click(screen.getByRole("button", { name: "Modificar" }));
    await screen.findByText(/Compila correctamente/);

    act(() => useEditorStore.setState({ source: CURRENT + "// nuevo\n" }));
    expect(await screen.findByText(/El código cambió mientras tanto/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("is honest when the proposal does not compile and labels the button accordingly", async () => {
    const client = new FakeClient(async () =>
      proposal({
        valid: false,
        svg: null,
        diagnostics: [{ severity: "error", code: "SEM-009", message: "Falta el parámetro requerido 'radio'", position: { line: 2, column: 1 } }],
        attempts: [
          { attempt: 1, valid: false, errors: 1 },
          { attempt: 2, valid: false, errors: 1 },
          { attempt: 3, valid: false, errors: 1 },
        ],
      }),
    );
    render(<AssistantPanel client={client} />);
    fireEvent.click(screen.getByRole("tab", { name: "Modificar" }));
    type("x");
    fireEvent.click(screen.getByRole("button", { name: "Modificar" }));

    expect(await screen.findByText(/No compila \(1 errores tras 3 intentos\)/)).toBeInTheDocument();
    expect(screen.getByText(/Falta el parámetro requerido/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar con errores" })).toBeInTheDocument();
  });

  it("generate does not send the editor's code", async () => {
    const client = new FakeClient(async () => proposal({ mode: "generate" }));
    render(<AssistantPanel client={client} />);
    type("una casa");
    fireEvent.click(screen.getByRole("button", { name: "Generar" }));
    await screen.findByText(/Compila correctamente/);
    expect(client.requests[0]).toEqual({ mode: "generate", prompt: "una casa" });
  });

  it("explain shows the text as plain text (no HTML is interpreted)", async () => {
    const client = new FakeClient(async () => ({ mode: "explain", explanation: "Dibuja un <b>círculo</b>", diagnostics: [], attempts: [] }));
    const { container } = render(<AssistantPanel client={client} />);
    fireEvent.click(screen.getByRole("tab", { name: "Explicar" }));
    fireEvent.click(screen.getByRole("button", { name: "Explicar" }));
    expect(await screen.findByText("Dibuja un <b>círculo</b>")).toBeInTheDocument();
    expect(container.querySelector(".assistant__explanation b")).toBeNull();
  });

  it("modify and explain need code in the editor", () => {
    useEditorStore.setState({ source: "" });
    render(<AssistantPanel client={new FakeClient(async () => proposal())} />);
    fireEvent.click(screen.getByRole("tab", { name: "Modificar" }));
    type("algo");
    expect(screen.getByRole("button", { name: "Modificar" })).toBeDisabled();
    expect(screen.getByText(/Escribe algo de código/)).toBeInTheDocument();
  });

  it("can be cancelled while it runs, aborting the request", async () => {
    let received: AbortSignal | undefined;
    const client = new FakeClient(
      (_request, signal) =>
        new Promise((_resolve, reject) => {
          received = signal;
          signal?.addEventListener("abort", () => reject(new AssistError("Solicitud cancelada.", "cancelled")));
        }),
    );
    render(<AssistantPanel client={client} />);
    type("una casa");
    fireEvent.click(screen.getByRole("button", { name: "Generar" }));

    fireEvent.click(await screen.findByRole("button", { name: /Cancelar/ }));
    await waitFor(() => expect(screen.getByText("Cancelaste la solicitud.")).toBeInTheDocument());
    expect(received?.aborted).toBe(true);
  });

  it("shows a friendly message for rate limits and keeps the editor untouched", async () => {
    const client = new FakeClient(async () => {
      throw new AssistError("Has usado el asistente demasiadas veces seguidas.", "rate-limit");
    });
    render(<AssistantPanel client={client} />);
    type("una casa");
    fireEvent.click(screen.getByRole("button", { name: "Generar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("demasiadas veces");
    expect(useEditorStore.getState().source).toBe(CURRENT);
  });

  it("runs a request handed over by the quick bar", async () => {
    const client = new FakeClient(async () => proposal({ mode: "generate" }));
    render(<AssistantPanel client={client} />);
    act(() => useEditorStore.getState().requestAssistant({ mode: "generate", prompt: "un gato" }));
    await screen.findByText(/Compila correctamente/);
    expect(client.requests[0]).toEqual({ mode: "generate", prompt: "un gato" });
    expect(useEditorStore.getState().assistantRequest).toBeNull();
  });
});
