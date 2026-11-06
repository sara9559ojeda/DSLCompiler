import { describe, expect, it } from "vitest";
import { applyChanges, createDefaultPipeline, planEdit, type Scene } from "@saramariaojeda9559/compiler-core";
import { findTargetAtOffset, overlayFor, planMove, planResize } from "../src/editing/visualEdit.js";

function sceneOf(source: string): Scene {
  return createDefaultPipeline({ embedIds: true }).compileWithStages(source).scene;
}

function drag(source: string, id: string, dx: number, dy: number): string {
  const scene = sceneOf(source);
  const request = planMove(scene, id, { x: dx, y: dy });
  if (!request) throw new Error("no move request");
  const plan = planEdit(source, scene, request);
  if (!plan.ok) throw new Error(plan.message);
  return applyChanges(source, plan.changes);
}

describe("planMove", () => {
  it("moves a circle by rewriting only its x and y", () => {
    const source = "// título\nc = crear_circulo(x=100, y=100, radio=30);\ncrear_rectangulo(x=1, y=1, ancho=5, alto=5);\n";
    expect(drag(source, "c", 20, -10)).toBe(
      "// título\nc = crear_circulo(x=120, y=90, radio=30);\ncrear_rectangulo(x=1, y=1, ancho=5, alto=5);\n",
    );
  });

  it("moves a line by both endpoints", () => {
    expect(drag("l = crear_linea(x1=0, y1=0, x2=10, y2=10);", "l", 5, 5)).toBe("l = crear_linea(x1=5, y1=5, x2=15, y2=15);");
  });

  it("converts a canvas drag into the local space of a scaled group", () => {
    const source = "grupo(x=100, y=100, escala=2) { c = crear_circulo(x=0, y=0, radio=5); }";
    // 40 canvas px at scale 2 is 20 local units.
    expect(drag(source, "c", 40, 0)).toContain("crear_circulo(x=20, y=0, radio=5)");
  });

  it("returns null for a target that cannot be moved", () => {
    expect(planMove(sceneOf("c = crear_circulo(x=1, y=1, radio=2);"), "nope", { x: 1, y: 1 })).toBeNull();
  });

  it("never turns an expression into a number: the plan is refused", () => {
    const source = "const cx = 100;\nc = crear_circulo(x=cx + 10, y=50, radio=5);";
    const scene = sceneOf(source);
    const request = planMove(scene, "c", { x: 5, y: 0 });
    const plan = planEdit(source, scene, request!);
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.reason).toBe("expression");
  });
});

describe("planResize", () => {
  it("changes the radius from the distance to the centre", () => {
    const source = "c = crear_circulo(x=100, y=100, radio=30);";
    const scene = sceneOf(source);
    const request = planResize(scene, "c", "e", { x: 150, y: 100 });
    const plan = planEdit(source, scene, request!);
    expect(plan.ok && applyChanges(source, plan.changes)).toBe("c = crear_circulo(x=100, y=100, radio=50);");
  });

  it("resizes a rectangle from its south-east corner", () => {
    const source = "r = crear_rectangulo(x=10, y=10, ancho=20, alto=20);";
    const scene = sceneOf(source);
    const plan = planEdit(source, scene, planResize(scene, "r", "se", { x: 60, y: 50 })!);
    expect(plan.ok && applyChanges(source, plan.changes)).toBe("r = crear_rectangulo(x=10, y=10, ancho=50, alto=40);");
  });
});

describe("findTargetAtOffset", () => {
  const source = "a = crear_circulo(x=1, y=1, radio=2);\nb = crear_circulo(x=5, y=5, radio=2);\n";
  it("finds the statement the cursor is inside", () => {
    const scene = sceneOf(source);
    expect(findTargetAtOffset(scene, source.indexOf("radio") )).toBe("a");
    expect(findTargetAtOffset(scene, source.lastIndexOf("radio"))).toBe("b");
  });

  it("returns null outside any statement", () => {
    expect(findTargetAtOffset(sceneOf(source), source.length)).toBeNull();
  });

  it("prefers the shape over the group that contains it", () => {
    const grouped = "grupo(x=1, y=1) { inner = crear_circulo(x=0, y=0, radio=3); }";
    expect(findTargetAtOffset(sceneOf(grouped), grouped.indexOf("radio"))).toBe("inner");
    expect(findTargetAtOffset(sceneOf(grouped), grouped.indexOf("grupo") + 2)).toMatch(/^grupo@/);
  });
});

describe("overlayFor", () => {
  it("describes the box and handles of a circle in canvas space", () => {
    const scene = sceneOf("c = crear_circulo(x=100, y=100, radio=30);");
    const overlay = overlayFor(scene, scene.shapes[0]!);
    expect(overlay?.corners[0]).toEqual({ x: 70, y: 70 });
    expect(overlay?.corners[2]).toEqual({ x: 130, y: 130 });
    expect(overlay?.handles.map((h) => h.id)).toEqual(["n", "e", "s", "w"]);
  });

  it("applies the group transform and a live override", () => {
    const scene = sceneOf("grupo(x=100, y=0, escala=2) { crear_circulo(x=0, y=0, radio=5); }");
    const overlay = overlayFor(scene, scene.shapes[0]!, { radio: 10 });
    expect(overlay?.corners[0]).toEqual({ x: 80, y: -20 });
    expect(overlay?.corners[2]).toEqual({ x: 120, y: 20 });
  });
});
