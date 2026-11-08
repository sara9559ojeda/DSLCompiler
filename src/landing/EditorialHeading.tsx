import type { ReactNode } from "react";

interface EditorialHeadingProps {
  readonly as?: "h1" | "h2" | "h3";
  /** One entry per visual line; each is revealed through its own mask. Use <em> for the expressive word. */
  readonly lines: readonly ReactNode[];
  readonly className?: string;
  /** "load" reveals on page load (hero); "scroll" ties the reveal to the scroll position (CSS view timeline). */
  readonly reveal?: "load" | "scroll";
}

/**
 * Giant editorial headline. The text is always in the DOM and visible by
 * default; the mask/rise reveal is a pure-CSS progressive enhancement (see
 * landing.css), so assistive tech and unsupported browsers just get the title.
 */
export function EditorialHeading({ as: Tag = "h2", lines, className = "", reveal = "scroll" }: EditorialHeadingProps): JSX.Element {
  return (
    <Tag className={`editorial editorial--${reveal} ${className}`}>
      {lines.map((line, index) => (
        <span className="editorial__line" key={index} style={{ ["--line" as string]: index }}>
          <span className="editorial__text">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
