import { X } from "lucide-react";
import { Mascot } from "./Mascot.js";
import { useGuideTips } from "../compiler/useGuideTips.js";

/** Appears only at key moments (first visit, and whenever a compile freshly turns into an error) — see useGuideTips.ts. */
export function GuideBubble(): JSX.Element | null {
  const { message, dismiss } = useGuideTips();

  if (!message) return null;

  return (
    <div className="guide-bubble" role="status">
      <Mascot />
      <div className="guide-bubble__card">
        <p className="guide-bubble__text">{message.text}</p>
        <button type="button" className="guide-bubble__close" onClick={dismiss} aria-label="Cerrar tip">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
