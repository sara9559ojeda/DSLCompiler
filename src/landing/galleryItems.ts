/**
 * "Made with DSL": the gallery shows presets that already ship with the
 * editor, compiled live — so "open in the editor" loads exactly the source
 * that produced the picture. Nothing here is a mock-up.
 */
export interface GalleryItem {
  readonly presetId: string;
  readonly category: string;
  /** Constructs of language 2.0 the example shows, listed on hover. */
  readonly features: readonly string[];
  /** Grid footprint on desktop (columns × rows of the asymmetric grid). */
  readonly span: "wide" | "tall" | "square" | "feature";
  readonly tone: "blue" | "orange" | "pink" | "cream" | "red" | "night";
}

export const GALLERY_ITEMS: readonly GalleryItem[] = [
  { presetId: "mandala", category: "Grupos", features: ["funcion", "para", "grupo(rotacion)"], span: "feature", tone: "night" },
  { presetId: "flor", category: "Ilustración", features: ["figuras básicas", "colores con nombre"], span: "tall", tone: "pink" },
  { presetId: "diagrama-arquitectura", category: "Diagrama automático", features: ["diagrama", "nodo", "conectar(etiqueta)"], span: "feature", tone: "cream" },
  { presetId: "grilla", category: "Patrón", features: ["const", "para anidado", "si / sino"], span: "square", tone: "orange" },
  { presetId: "radial", category: "Geometría abstracta", features: ["cos / sin", "crear_linea"], span: "square", tone: "blue" },
  { presetId: "ciudad", category: "Composición", features: ["expresiones", "para anidado", "floor()"], span: "wide", tone: "red" },
  { presetId: "arbol-fractal", category: "Recursión", features: ["funcion recursiva", "si / sino"], span: "square", tone: "cream" },
];
