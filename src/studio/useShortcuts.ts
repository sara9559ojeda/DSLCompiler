import { useEffect } from "react";

export const SHORTCUT_HELP: readonly { readonly keys: string; readonly action: string }[] = [
  { keys: "Ctrl/⌘ + S", action: "Guardar ahora (en este navegador)" },
  { keys: "Ctrl/⌘ + B", action: "Mostrar u ocultar el explorador" },
  { keys: "Ctrl/⌘ + J", action: "Mostrar u ocultar los problemas" },
  { keys: "Ctrl/⌘ + Shift + E", action: "Exportar SVG" },
  { keys: "Alt + 1 / 2 / 3", action: "Panel derecho: Resultado / Asistente / Exportar" },
  { keys: "Ctrl/⌘ + Shift + A", action: "Abrir el asistente de IA" },
  { keys: "Ctrl/⌘ + Z / Shift + Z", action: "Deshacer / rehacer (en el editor y el lienzo)" },
  { keys: "Flechas en un separador", action: "Redimensionar el panel (Inicio/Fin: límites)" },
];

export type ShortcutMap = Readonly<Record<string, () => void>>;

export function describeKeyEvent(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  // Alt+digit produces symbols on some layouts: use the physical key for digits.
  const key = /^Digit\d$/.test(event.code) ? event.code.slice(5) : event.key.toLowerCase();
  parts.push(key);
  return parts.join("+");
}

/**
 * Global studio shortcuts. Listens in the capture phase so they also work while
 * Monaco has focus; only combinations present in `map` are intercepted.
 */
export function useShortcuts(map: ShortcutMap): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const action = map[describeKeyEvent(event)];
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      action();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [map]);
}
