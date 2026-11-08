export type DiffOp = { readonly type: "same" | "add" | "del"; readonly text: string };

/** Above this many line pairs the exact diff would be slow; the change is then shown as a full replacement. */
const MAX_CELLS = 4_000_000;

/**
 * Line diff (longest common subsequence) between the current program and a
 * proposal. Pure and dependency-free: it is only used to *show* a change for
 * review; applying a proposal always replaces the text as a whole.
 */
export function diffLines(before: string, after: string): DiffOp[] {
  const a = before.split("\n");
  const b = after.split("\n");

  // Trim the common head and tail first: most edits touch a few lines of a long file.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;

  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);
  const ops: DiffOp[] = a.slice(0, head).map((text): DiffOp => ({ type: "same", text }));

  if (midA.length * midB.length > MAX_CELLS) {
    ops.push(...midA.map((text): DiffOp => ({ type: "del", text })), ...midB.map((text): DiffOp => ({ type: "add", text })));
  } else {
    ops.push(...lcsDiff(midA, midB));
  }
  ops.push(...a.slice(a.length - tail).map((text): DiffOp => ({ type: "same", text })));
  return ops;
}

function lcsDiff(a: readonly string[], b: readonly string[]): DiffOp[] {
  const cols = b.length + 1;
  const table = new Uint32Array((a.length + 1) * cols);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] =
        a[i] === b[j] ? table[(i + 1) * cols + j + 1]! + 1 : Math.max(table[(i + 1) * cols + j]!, table[i * cols + j + 1]!);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", text: a[i]! });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j]! >= table[i * cols + j + 1]!) {
      ops.push({ type: "del", text: a[i]! });
      i += 1;
    } else {
      ops.push({ type: "add", text: b[j]! });
      j += 1;
    }
  }
  for (; i < a.length; i += 1) ops.push({ type: "del", text: a[i]! });
  for (; j < b.length; j += 1) ops.push({ type: "add", text: b[j]! });
  return ops;
}

export interface Hunk {
  readonly ops: readonly DiffOp[];
  /** Unchanged lines hidden before this hunk (for a "N líneas sin cambios" marker). */
  readonly skippedBefore: number;
}

/** Keeps only the changed lines with `context` unchanged lines around them. */
export function collapseDiff(ops: readonly DiffOp[], context = 2): { hunks: Hunk[]; skippedAfter: number } {
  const keep = ops.map(() => false);
  ops.forEach((op, index) => {
    if (op.type === "same") return;
    for (let k = Math.max(0, index - context); k <= Math.min(ops.length - 1, index + context); k += 1) keep[k] = true;
  });

  const hunks: Hunk[] = [];
  let current: DiffOp[] = [];
  let skipped = 0;
  let pendingSkip = 0;
  ops.forEach((op, index) => {
    if (keep[index]) {
      if (current.length === 0) pendingSkip = skipped;
      current.push(op);
      skipped = 0;
    } else {
      if (current.length > 0) {
        hunks.push({ ops: current, skippedBefore: pendingSkip });
        current = [];
      }
      skipped += 1;
    }
  });
  if (current.length > 0) hunks.push({ ops: current, skippedBefore: pendingSkip });
  return { hunks, skippedAfter: skipped };
}

export const hasChanges = (ops: readonly DiffOp[]): boolean => ops.some((op) => op.type !== "same");
