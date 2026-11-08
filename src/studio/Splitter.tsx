import { useRef, type KeyboardEvent, type PointerEvent } from "react";

interface SplitterProps {
  readonly orientation: "vertical" | "horizontal";
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  readonly label: string;
  /** +1: dragging right/down grows `value` (left panel); -1: it shrinks it (right/bottom panels). */
  readonly sign: 1 | -1;
  readonly onReset?: () => void;
}

const KEY_STEP = 24;

/**
 * Resizable separator: drag with the pointer, or focus it and use the arrow
 * keys (Home/End jump to the limits, double-click resets). The size lives in
 * the parent; this component only translates gestures into numbers.
 */
export function Splitter({ orientation, value, min, max, onChange, label, sign, onReset }: SplitterProps): JSX.Element {
  const drag = useRef<{ start: number; origin: number } | null>(null);
  const clamp = (next: number): number => Math.min(max, Math.max(min, Math.round(next)));
  const axis = (event: { clientX: number; clientY: number }): number => (orientation === "vertical" ? event.clientX : event.clientY);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { start: axis(event), origin: value };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return;
    onChange(clamp(drag.current.origin + sign * (axis(event) - drag.current.start)));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const grow = orientation === "vertical" ? "ArrowRight" : "ArrowDown";
    const shrink = orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
    if (event.key === grow) onChange(clamp(value + sign * KEY_STEP));
    else if (event.key === shrink) onChange(clamp(value - sign * KEY_STEP));
    else if (event.key === "Home") onChange(min);
    else if (event.key === "End") onChange(max);
    else return;
    event.preventDefault();
  };

  return (
    <div
      className={`splitter splitter--${orientation}`}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={onReset}
    />
  );
}
