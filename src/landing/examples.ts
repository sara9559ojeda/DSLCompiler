/**
 * Playground examples for "From code to art". Each one is a real DSL program
 * generated from a few parameters (the sliders edit the `const` lines you see
 * in the code panel) — there are no pre-rendered images: whatever appears on
 * the right is compiled by the real compiler in the Web Worker.
 * tests/landingExamples.test.ts compiles every example at its default and
 * extreme parameter values.
 */

export interface NumberControl {
  readonly kind: "number";
  readonly key: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
}

export interface ChoiceControl {
  readonly kind: "choice";
  readonly key: string;
  readonly label: string;
  readonly options: readonly string[];
  readonly value: string;
}

export type Control = NumberControl | ChoiceControl;
export type ControlValues = Readonly<Record<string, number | string>>;

export interface PlaygroundExample {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly controls: readonly Control[];
  readonly build: (values: ControlValues) => string;
}

const lines = (...rows: string[]): string => rows.join("\n") + "\n";
const num = (values: ControlValues, key: string): number => Number(values[key]);
const str = (values: ControlValues, key: string): string => String(values[key]);

const ORBITA: PlaygroundExample = {
  id: "orbita",
  name: "Órbita",
  blurb: "Un bucle reparte círculos sobre una circunferencia con cos() y sin().",
  controls: [
    { kind: "number", key: "cantidad", label: "Cantidad", min: 3, max: 48, step: 1, value: 20 },
    { kind: "number", key: "distancia", label: "Radio", min: 60, max: 250, step: 5, value: 170 },
    { kind: "number", key: "tam", label: "Tamaño", min: 4, max: 34, step: 1, value: 16 },
    { kind: "choice", key: "tono", label: "Color", options: ["naranja", "celeste", "rosa", "rojo"], value: "naranja" },
  ],
  build: (v) =>
    lines(
      "// Órbita: un círculo por vuelta del bucle, sobre una circunferencia.",
      `const cantidad = ${num(v, "cantidad")};`,
      `const distancia = ${num(v, "distancia")};`,
      `const tam = ${num(v, "tam")};`,
      "",
      "fondo = crear_rectangulo(ancho=800, alto=600, x=0, y=0, color=#061f28);",
      "para (let i = 0; i < cantidad; i = i + 1) {",
      "  crear_circulo(",
      "    x=400 + cos(i * 360 / cantidad) * distancia,",
      "    y=300 + sin(i * 360 / cantidad) * distancia,",
      `    radio=tam, color=${str(v, "tono")}`,
      "  );",
      "}",
      "crear_circulo(x=400, y=300, radio=distancia / 4, color=blanco);",
      "crear_circulo(x=400, y=300, radio=distancia / 8, color=#061f28);",
    ),
};

const MANDALA: PlaygroundExample = {
  id: "mandala",
  name: "Mandala",
  blurb: "Una función dibuja un anillo de formas girado con grupo(); tres llamadas, tres anillos.",
  controls: [
    { kind: "number", key: "cantidad", label: "Pétalos", min: 4, max: 40, step: 1, value: 18 },
    { kind: "number", key: "distancia", label: "Radio", min: 60, max: 230, step: 5, value: 180 },
    { kind: "choice", key: "tono", label: "Color", options: ["morado", "celeste", "rosa", "dorado"], value: "celeste" },
  ],
  build: (v) =>
    lines(
      "// Mandala: 'grupo' gira cada forma alrededor del centro.",
      `const cantidad = ${num(v, "cantidad")};`,
      `const distancia = ${num(v, "distancia")};`,
      "",
      "fondo = crear_rectangulo(ancho=800, alto=600, x=0, y=0, color=#1b1b3a);",
      "",
      "funcion anillo(n, d, tam, tono) {",
      "  para (let i = 0; i < n; i = i + 1) {",
      "    grupo(x=400, y=300, rotacion=i * 360 / n) {",
      "      crear_rectangulo(ancho=tam, alto=tam / 2, x=d, y=-tam / 4, color=tono, opacidad=0.85, rotacion=45);",
      "    }",
      "  }",
      "}",
      "",
      `anillo(cantidad, distancia, 46, ${str(v, "tono")});`,
      "anillo(cantidad, distancia * 0.68, 38, rosa);",
      "anillo(cantidad / 2, distancia * 0.38, 30, dorado);",
      "crear_circulo(x=400, y=300, radio=20, color=blanco);",
    ),
};

const RADIAL: PlaygroundExample = {
  id: "radial",
  name: "Rayos",
  blurb: "si / sino alterna dos colores: la condición decide cada rayo.",
  controls: [
    { kind: "number", key: "rayos", label: "Rayos", min: 6, max: 90, step: 2, value: 44 },
    { kind: "number", key: "largo", label: "Largo", min: 80, max: 270, step: 5, value: 250 },
    { kind: "choice", key: "tono", label: "Color A", options: ["dorado", "rosa", "rojo", "verde"], value: "dorado" },
  ],
  build: (v) =>
    lines(
      "// Rayos alternados: la condición elige el color de cada línea.",
      `const rayos = ${num(v, "rayos")};`,
      `const largo = ${num(v, "largo")};`,
      "",
      "fondo = crear_rectangulo(ancho=800, alto=600, x=0, y=0, color=#101820);",
      "para (let i = 0; i < rayos; i = i + 1) {",
      "  let tono = celeste;",
      "  si (i % 2 == 0) {",
      `    tono = ${str(v, "tono")};`,
      "  }",
      "  const a = i * 360 / rayos;",
      "  crear_linea(x1=400 + cos(a) * 40, y1=300 + sin(a) * 40, x2=400 + cos(a) * largo, y2=300 + sin(a) * largo, color=tono);",
      "}",
      "crear_circulo(x=400, y=300, radio=30, color=blanco);",
    ),
};

const ARQUITECTURA: PlaygroundExample = {
  id: "arquitectura",
  name: "Diagrama",
  blurb: "`diagrama` coloca los nodos solo (auto-layout) y `conectar` los une con flechas.",
  controls: [
    { kind: "choice", key: "direccion", label: "Dirección", options: ["horizontal", "vertical"], value: "horizontal" },
    { kind: "number", key: "espaciado", label: "Espaciado", min: 40, max: 160, step: 10, value: 90 },
  ],
  build: (v) =>
    lines(
      "// Los nodos no llevan x/y: el diagrama calcula el layout.",
      `diagrama arquitectura(direccion="${str(v, "direccion")}", espaciado=${num(v, "espaciado")}) {`,
      '  front = nodo("Frontend", color=celeste);',
      '  gateway = nodo("Gateway", color=naranja);',
      '  compilador = nodo("Compilador gRPC", color=verde);',
      '  ia = nodo("Asistente IA", color=morado);',
      '  conectar(front, gateway, etiqueta="HTTPS");',
      '  conectar(gateway, compilador, etiqueta="gRPC");',
      '  conectar(gateway, ia, etiqueta="HTTP");',
      "}",
    ),
};

export const PLAYGROUND_EXAMPLES: readonly PlaygroundExample[] = [ORBITA, MANDALA, RADIAL, ARQUITECTURA];

export function defaultValues(example: PlaygroundExample): ControlValues {
  return Object.fromEntries(example.controls.map((control) => [control.key, control.value]));
}

/** Every combination of each control at its minimum / maximum / option — what the tests compile. */
export function extremeValues(example: PlaygroundExample): readonly ControlValues[] {
  const base = defaultValues(example);
  const variants: ControlValues[] = [base];
  for (const control of example.controls) {
    const alternatives = control.kind === "number" ? [control.min, control.max] : control.options;
    for (const value of alternatives) variants.push({ ...base, [control.key]: value });
  }
  return variants;
}
