import { describe, expect, it } from "vitest";
import { completionsAt, declarationsIn, findDeclarationOffset, hoverDocFor } from "../src/editor/dslCompletions.js";

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
    expect(labels("crear_circulo(radio=5, ")).toEqual(["x=", "y=", "color=", "opacidad="]);
  });

  it("after color= offers the named colors", () => {
    expect(labels("crear_circulo(radio=5, x=1, y=1, color=")).toEqual(expect.arrayContaining(["rojo", "azul", "verde"]));
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
    expect(labels("crear_circulo(radio=5, // nota; (x\n")).toEqual(["x=", "y=", "color=", "opacidad="]);
  });

  it("offers nothing inside an unknown command", () => {
    expect(labels("crear_triangulo(")).toEqual([]);
  });

  it("also offers the language keywords and your own functions at the start of a statement", () => {
    const text = "funcion flor(x, y) { }\n";
    expect(labels(text, text)).toEqual(expect.arrayContaining(["const", "let", "para", "si", "funcion", "grupo", "flor"]));
  });

  it("expands 'para' to a complete loop header", () => {
    const loop = completionsAt("", "").find((item) => item.label === "para");
    expect(loop).toMatchObject({ isSnippet: true });
    expect(loop!.insertText).toContain("${1:i} < ${2:10}");
  });

  it("knows it is still inside crear_circulo( after a nested call like cos(...)", () => {
    expect(labels("crear_circulo(x=250 + cos(i * 30) * 120, ")).toEqual(["radio=", "y=", "color=", "opacidad="]);
  });

  it("suggests your variables and math functions after param=", () => {
    const text = "const centro = 250;\nlet paso = 3;\ncrear_circulo(radio=5, x=";
    expect(labels(text)).toEqual(expect.arrayContaining(["centro", "paso", "sin", "cos", "sqrt"]));
  });

  it("still offers the named colors (and variables) after color=, but not math functions", () => {
    const text = "const mio = #ff8800;\ncrear_circulo(color=";
    const items = labels(text);
    expect(items).toEqual(expect.arrayContaining(["rojo", "mio"]));
    expect(items).not.toContain("sin");
  });

  it("works inside blocks (after '{' and '}')", () => {
    expect(labels("para (let i = 0; i < 3; i = i + 1) {\n  crear_ci")).toContain("crear_circulo");
    expect(labels("si (1) { } ")).toContain("crear_texto");
  });

  it("offers a user function's own parameter names", () => {
    const text = "funcion flor(x, y, cantidad) { }\nflor(";
    expect(labels(text)).toEqual(["x=", "y=", "cantidad=", ...labels(text).slice(3)]);
    expect(labels(text).slice(0, 3)).toEqual(["x=", "y=", "cantidad="]);
  });
});

describe("declarations, hover and go-to-definition", () => {
  const program = [
    "const centro = 250; // constante",
    "funcion flor(x, y) {",
    "  c = crear_circulo(radio=5, x=x, y=y);",
    "}",
    "para (let i = 0; i < 3; i = i + 1) { flor(centro, i); }",
  ].join("\n");

  it("finds shapes, constants, variables and functions", () => {
    const found = declarationsIn(program);
    expect(found.shapes).toEqual(["c"]);
    expect(found.functions.map((fn) => [fn.name, fn.params])).toEqual([["flor", ["x", "y"]]]);
    expect(found.variables.map((variable) => variable.name)).toEqual(expect.arrayContaining(["centro", "i", "x", "y"]));
  });

  it("ignores declarations inside comments and strings", () => {
    expect(declarationsIn('// const fantasma = 1;\ncrear_texto(contenido="const falso = 2", x=0, y=0);').variables).toEqual([]);
  });

  it("documents commands, math functions, keywords, colors and your own names on hover", () => {
    expect(hoverDocFor("crear_circulo", "")).toContain("radio: número");
    expect(hoverDocFor("sin", "")).toContain("grados");
    expect(hoverDocFor("para", "")).toContain("10 000");
    expect(hoverDocFor("rojo", "")).toContain("#e53935");
    expect(hoverDocFor("flor", program)).toContain("flor(x, y)");
    expect(hoverDocFor("centro", program)).toContain("Constante");
    expect(hoverDocFor("noexiste", program)).toBeNull();
  });

  it("jumps to where a function, constant or shape is declared", () => {
    const at = (name: string) => program.slice(findDeclarationOffset(program, name)!);
    expect(at("flor").startsWith("flor(x, y)")).toBe(true);
    expect(at("centro").startsWith("centro = 250")).toBe(true);
    expect(at("c").startsWith("c = crear_circulo")).toBe(true);
    expect(findDeclarationOffset(program, "noexiste")).toBeNull();
  });
});
