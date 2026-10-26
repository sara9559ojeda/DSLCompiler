import { describe, expect, it } from "vitest";
import { completionsAt } from "../src/editor/dslCompletions.js";

const labels = (textBeforeCursor: string, fullText = textBeforeCursor) =>
  completionsAt(textBeforeCursor, fullText).map((item) => item.label);

describe("DSL autocomplete", () => {
  it("offers every command at the start of a statement, as a snippet with required params", () => {
    const items = completionsAt("c1 = cr", "c1 = cr");
    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining(["crear_circulo", "crear_rectangulo", "crear_linea", "crear_texto", "conectar"]),
    );
    expect(items.find((item) => item.label === "crear_circulo")).toMatchObject({
      isSnippet: true,
      insertText: "crear_circulo(radio=${1:50}, x=${2:50}, y=${3:50})",
    });
  });

  it("offers commands again after a finished statement", () => {
    expect(labels("crear_circulo(radio=5, x=1, y=1);\n")).toContain("crear_texto");
  });

  it("inside a call, offers only the params not used yet", () => {
    expect(labels("crear_circulo(radio=5, ")).toEqual(["x=", "y=", "color="]);
  });

  it("after color= offers the named colors", () => {
    expect(labels("crear_circulo(radio=5, x=1, y=1, color=")).toEqual(
      expect.arrayContaining(["rojo", "azul", "verde"]),
    );
  });

  it("after tipo= offers the allowed connection types", () => {
    expect(labels("conectar(a, b, tipo=")).toEqual(["linea", "flecha"]);
  });

  it("in conectar, offers the shapes declared in the program", () => {
    const program = "casa = crear_rectangulo(ancho=5, alto=5, x=0, y=0);\nsol = crear_circulo(radio=5, x=9, y=9);\n";
    const before = `${program}conectar(`;
    expect(labels(before, before)).toEqual(expect.arrayContaining(["casa", "sol", "origen=", "destino="]));
  });

  it("ignores semicolons and parens inside comments", () => {
    expect(labels("crear_circulo(radio=5, // nota; (x\n")).toEqual(["x=", "y=", "color="]);
  });

  it("offers nothing inside an unknown command", () => {
    expect(labels("crear_triangulo(")).toEqual([]);
  });
});
