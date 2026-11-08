/**
 * The Creative AI section shows the shape of the assistant's flow with a
 * sample that is *labelled as an example*: the prompt and code below were
 * written by hand, not produced by a live model call. What IS real on the page
 * is the validation — the code is compiled by the actual compiler — and the
 * "Probar con IA" action, which sends the user's own prompt to the real
 * assistant in the studio (it answers only when the backend has an
 * ANTHROPIC_API_KEY configured).
 */
export const AI_EXAMPLE = {
  prompt: "Un sol naranja que se pone detrás de tres montañas azules",
  code: [
    "// Ejemplo escrito a mano para ilustrar el formato de respuesta del asistente.",
    "cielo = crear_rectangulo(ancho=800, alto=600, x=0, y=0, color=#fdd9a0);",
    "sol = crear_circulo(radio=90, x=400, y=330, color=naranja);",
    "",
    "para (let i = 0; i < 3; i = i + 1) {",
    "  const lado = 200 + (i % 2) * 70;",
    "  const cx = 150 + i * 250;",
    "  crear_rectangulo(ancho=lado, alto=lado, x=cx - lado / 2, y=520 - lado / 2, color=azul, rotacion=45);",
    "}",
    "crear_rectangulo(ancho=800, alto=80, x=0, y=520, color=#06232d);",
    "",
  ].join("\n"),
} as const;
