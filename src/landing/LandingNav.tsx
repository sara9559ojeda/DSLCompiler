import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "../components/BrandMotif.js";
import { navigate } from "../routing/useHashRoute.js";

const LINKS = [
  { href: "#lienzo", label: "Lienzo" },
  { href: "#del-codigo-al-arte", label: "Del código al arte" },
  { href: "#galeria", label: "Galería" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#ia", label: "IA creativa" },
] as const;

export function LandingNav(): JSX.Element {
  return (
    <header className="lnav">
      {/* scroll-progress bar: a CSS scroll() timeline scales it, no JS */}
      <div className="lnav__progress" aria-hidden="true" />
      <a className="lnav__brand" href="#lienzo" aria-label="DSL Studio, inicio">
        <BrandMark />
        <span className="lnav__wordmark">DSL&nbsp;STUDIO</span>
      </a>
      <nav className="lnav__links" aria-label="Secciones">
        {LINKS.map((link) => (
          <a key={link.href} className="lnav__link" href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <a
        className="lnav__cta"
        href="#/estudio"
        onClick={(event) => {
          event.preventDefault();
          navigate("studio");
        }}
      >
        Abrir estudio <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </header>
  );
}
