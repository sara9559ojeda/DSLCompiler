import type { ElementType, ReactNode } from "react";

interface ScrollRevealProps {
  readonly as?: ElementType;
  readonly effect?: "rise" | "from-left" | "from-right" | "scale";
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Marks a block for a scroll-driven entrance. It renders no JavaScript
 * behaviour at all: the animation lives in landing.css (`animation-timeline:
 * view()`), gated by @supports and prefers-reduced-motion, so the content is
 * simply visible wherever scroll-driven animations aren't available.
 */
export function ScrollReveal({ as: Tag = "div", effect = "rise", className = "", children }: ScrollRevealProps): JSX.Element {
  return <Tag className={`reveal reveal--${effect} ${className}`}>{children}</Tag>;
}
