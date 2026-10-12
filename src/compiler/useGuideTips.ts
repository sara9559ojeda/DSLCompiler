import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../state/useEditorStore.js";
import { GUIDE_WELCOME_SEEN_KEY, GUIDE_WELCOME_DELAY_MS } from "../config/app.config.js";

export interface GuideMessage {
  readonly id: string;
  readonly text: string;
}

const WELCOME_TEXT =
  "¡Hola! Soy tu guía del DSL. Cada figura es nombre = comando(parámetro=valor, ...); — probá " +
  "crear_circulo(radio=50, color=rojo, x=10, y=10) y mirá la previsualización actualizarse sola.";

const GENERIC_ERROR_TIP = "Hay un error de sintaxis — revisá los mensajes de abajo, línea y columna te dicen justo dónde mirar.";
const VALID_COMMANDS = "crear_circulo, crear_rectangulo, crear_linea, crear_texto y conectar";

/**
 * Pattern-matches the compiler's own diagnostic message (exact templates
 * from packages/compiler-core's Parser/SemanticAnalyzer) to a more
 * actionable tip, falling back to a generic one for the rest. Ordered
 * most-specific first.
 */
function tipForDiagnostic(message: string): string {
  if (/se esperaba '\)'/i.test(message)) {
    return "Te faltó cerrar un paréntesis — cada crear_x(...) necesita su ) al final, después del último parámetro.";
  }
  if (/se esperaba '\('/i.test(message)) {
    return "A un comando le falta el ( de apertura — la forma es nombre_comando(param=valor, ...).";
  }
  if (/se esperaba ';'/i.test(message)) {
    return "Cada instrucción termina en punto y coma ( ; ), incluso la última.";
  }
  if (/se esperaba '='/i.test(message)) {
    return "Para nombrar una figura usá identificador = comando(...); — te falta el = entre el nombre y el comando.";
  }
  if (/se esperaba un valor/i.test(message)) {
    return "Un parámetro quedó sin valor — puede ser un número, un color, texto entre comillas o el nombre de otra figura.";
  }
  if (/nombre de un comando|comando desconocido/i.test(message)) {
    return `Ese no es un comando válido. Los comandos disponibles son ${VALID_COMMANDS}.`;
  }
  if (/no declarad/i.test(message)) {
    return "conectar(...) necesita que ambas figuras ya existan — asignalas primero con nombre = crear_...(...) antes de conectarlas.";
  }
  if (/ya fue declarado/i.test(message)) {
    return "Ese nombre de figura ya está en uso — cada identificador (c1, r1, ...) debe ser único en el programa.";
  }
  if (/argumentos posicionales deben ir antes/i.test(message)) {
    return "Los argumentos sin nombre van primero — poné radio=50 después de cualquier valor suelto, no antes.";
  }
  if (/argumento duplicado/i.test(message)) {
    return "Le pasaste el mismo parámetro dos veces a un comando — cada parámetro solo puede aparecer una vez.";
  }
  if (/par[aá]metro desconocido/i.test(message)) {
    return "Ese parámetro no existe para ese comando — fijate el nombre exacto en los ejemplos (radio, color, x, y, ancho, alto...).";
  }
  if (/falta el par[aá]metro requerido/i.test(message)) {
    return "A esa figura le falta un parámetro obligatorio — cada crear_x tiene los suyos (radio, color, x, y, etc).";
  }
  if (/color desconocido/i.test(message)) {
    return "Ese color no existe — probá con uno de los nombres básicos (rojo, azul, verde, negro, blanco...) o un código hex como #ff0000.";
  }
  if (/no admite/i.test(message)) {
    return "El valor que le diste a ese parámetro no es del tipo que espera — revisá si pide número, color, texto o el nombre de otra figura.";
  }
  return GENERIC_ERROR_TIP;
}

/**
 * Decides when the guide character should speak up: once on first visit
 * (a real syntax example, not a generic greeting), and again whenever a
 * compile freshly transitions into an error state (not on every keystroke
 * while it stays broken — only the edge, so it doesn't nag).
 */
export function useGuideTips(): { message: GuideMessage | null; dismiss: () => void } {
  const result = useEditorStore((s) => s.result);
  const [message, setMessage] = useState<GuideMessage | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const hadErrorRef = useRef(false);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = window.localStorage.getItem(GUIDE_WELCOME_SEEN_KEY) === "1";
    } catch {
      // private browsing / unavailable storage — just show it every time, no crash
    }
    if (alreadySeen) return;

    const timer = window.setTimeout(() => {
      setMessage({ id: "welcome", text: WELCOME_TEXT });
      try {
        window.localStorage.setItem(GUIDE_WELCOME_SEEN_KEY, "1");
      } catch {
        // best-effort only
      }
    }, GUIDE_WELCOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const firstError = result?.diagnostics.find((d) => d.severity === "error");
    const hasError = Boolean(firstError);

    if (hasError && !hadErrorRef.current) {
      const text = firstError ? tipForDiagnostic(firstError.message) : GENERIC_ERROR_TIP;
      setMessage({ id: `error:${firstError?.message ?? "generic"}`, text });
    }
    hadErrorRef.current = hasError;
  }, [result]);

  const dismiss = (): void => {
    if (message) setDismissedId(message.id);
  };

  const visible = message && message.id !== dismissedId ? message : null;
  return { message: visible, dismiss };
}
