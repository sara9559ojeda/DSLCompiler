import { ArrowUp, ExternalLink } from "lucide-react";
import { BrandMark } from "./BrandMotif.js";
import { BRAND_NAME, PROJECT_LINKS } from "../config/app.config.js";

const SECTIONS = [
  { label: "Proyecto", href: "#proyecto" },
  { label: "Compilar", href: "#compilar" },
  { label: "Exportaciones", href: "#exportaciones" },
] as const;

export function Footer(): JSX.Element {
  return (
    <footer className="site-footer">
      <div className="brand-stripe" aria-hidden="true" />
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__logo">
            <BrandMark />
            <span className="site-footer__wordmark">{BRAND_NAME}</span>
          </div>
          <p className="site-footer__tagline">
            Escribe figuras en un lenguaje propio y míralas compilarse en vivo a SVG o PNG.
          </p>
          <ul className="site-footer__chips" aria-label="Cómo está hecho">
            <li>Lexer → Parser → IR → SVG</li>
            <li>gRPC</li>
            <li>TypeScript</li>
          </ul>
        </div>

        <nav className="site-footer__column" aria-label="Secciones (pie de página)">
          <h2 className="site-footer__heading">Explorar</h2>
          <ul className="site-footer__links">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <a className="site-footer__link" href={section.href}>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__column">
          <h2 className="site-footer__heading">Código abierto</h2>
          <ul className="site-footer__links">
            {PROJECT_LINKS.map((link) => (
              <li key={link.href}>
                <a className="site-footer__link" href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                  <ExternalLink size={13} aria-hidden />
                  <span className="visually-hidden"> (se abre en otra pestaña)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>
          © {new Date().getFullYear()} {BRAND_NAME}
        </span>
        <a className="site-footer__top" href="#top">
          Volver arriba
          <ArrowUp size={14} aria-hidden />
        </a>
      </div>
    </footer>
  );
}
