/**
 * The hero's protagonist — the project's real illustration asset
 * (public/images/artista_cubista.png), shown as an actual <img>. Never
 * redrawn in CSS/SVG, never cropped or recolored: sizing is handled by
 * .hero__portrait in index.css via max-width/height only, so the browser
 * scales the original proportionally instead of us faking a crop or a
 * stretch.
 */
export function HeroCharacter(): JSX.Element {
  return (
    <img
      className="hero__portrait"
      src="/images/artista_cubista.png"
      alt="Ilustración de un artista cubista con boina, bigote, pincel y paleta de colores"
      width={1199}
      height={1312}
    />
  );
}
