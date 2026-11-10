# DSLCompiler — Frontend

Editor + previsualización en vivo + exportación para el Compilador de
Imágenes (DSL de figuras → SVG/PNG). Consume el backend
([`DSLCompiler_Backend`](https://github.com/sara9559ojeda/DSLCompiler_Backend))
por HTTP para exportar PNG, y compila a SVG en vivo enteramente en el
navegador usando [`@saramariaojeda9559/compiler-core`](https://www.npmjs.com/package/@saramariaojeda9559/compiler-core)
(snapshot del lenguaje 2.0 fijado en `vendor/`; ver `vendor/README.md`).

## Diseño (INP < 200ms)

- **Compilación en Web Worker**: `src/compiler/compiler.worker.ts` importa
  `@saramariaojeda9559/compiler-core` (el mismo Lexer/Parser/SemanticAnalyzer/
  CodeGenerator que usa el backend, sin `sharp`) y corre el pipeline
  completo fuera del hilo principal. Una tecla nunca hace más que actualizar
  el estado del editor — el parseo llega después, en otro hilo.
- **Debounce de 300ms** (`useCompilerSync.ts`) antes de disparar un compile.
- **Monaco cargado de forma perezosa** (`React.lazy` + `import()`), fuera
  del bundle inicial — ver `CodeEditor.tsx`.
- **Exportar SVG es 100% cliente** (el SVG ya compilado, sin red). Exportar
  PNG necesita `sharp` (nativo, solo backend), así que ese botón da
  feedback optimista inmediato y hace la llamada de red después, sin
  bloquear el click.
- `web-vitals` reporta INP/LCP/CLS a consola en desarrollo (`main.tsx`).

## URL del gateway: configuración en tiempo de ejecución, no de build

`GATEWAY_URL` (`src/config/app.config.ts`) se resuelve así: primero
`window.__RUNTIME_CONFIG__` (generado al *arrancar* el contenedor por
`docker/runtime-config-entrypoint.sh`, desde la variable de entorno
`$GATEWAY_URL` del servicio), después `VITE_GATEWAY_URL` (build-time, para
`npm run dev`/`vite build` sin Docker), y por último
`http://localhost:4000`. Así la misma imagen Docker sirve para cualquier
entorno (local, Render, lo que sea) sin reconstruir — necesario porque
Render no soporta pasar build args de Docker vía `render.yaml`.

## Desarrollo

```bash
cp .env.example .env
npm install
npm run dev        # necesita el gateway del backend corriendo para exportar PNG
npm test
npm run typecheck
npm run lint
```

Por defecto `npm run dev` apunta a `http://localhost:4000` — para probar
contra el backend local, clona
[`DSLCompiler_Backend`](https://github.com/sara9559ojeda/DSLCompiler_Backend)
aparte y corré `docker compose up -d --build` ahí.

## Build de producción / Docker

```bash
npm run build          # dist/ estático
docker build -t dslcompiler-web .
docker run -p 8080:80 -e GATEWAY_URL=http://localhost:4000 dslcompiler-web
```

## Desplegar

### Vercel (frontend de producción)

El proyecto `dslcompiler-web` usa `vercel.json`: `npm ci`, `npm run build`
y salida `dist/`. La dependencia del compilador está incluida en `vendor/`,
por lo que no necesita un checkout local del backend ni publicar en npm.
Configura `VITE_GATEWAY_URL` en Production con la URL HTTPS del gateway;
actualmente `https://compiler-img-gateway.onrender.com`. El gateway debe
permitir `https://dslcompiler-web.vercel.app` en `CORS_ORIGIN`.

Para desplegar desde este repositorio, con la sesión de Vercel iniciada:

```bash
npm ci
npm run typecheck
npm test
npm run build
vercel --prod
```

### Render (alternativa Docker)

[`render.yaml`](render.yaml) despliega este frontend solo, en
[Render](https://render.com), como un servicio Docker independiente. Una
vez desplegado el backend (su propio `render.yaml`, en su propio repo),
copiá la URL pública de `compiler-img-gateway` y pegala como `GATEWAY_URL`
en este servicio — y agregá la URL pública de este frontend como
`CORS_ORIGIN` en el gateway del backend.

## E2E (Playwright)

Corre contra un build ya levantado — no arranca un dev server propio. Por
defecto apunta a `http://localhost:8080`; override con `E2E_BASE_URL` para
apuntar a `npm run dev` (`:5173`) u otro destino. Necesita el backend
corriendo en paralelo (local o desplegado) para los flujos que exportan
PNG o usan IA.

```bash
npm run build && npm run preview -- --port 8080   # o docker run (ver arriba)
npm run e2e
```

Usa el canal `chrome` del sistema (no descarga un Chromium propio) — tanto
en local como en CI (`ubuntu-latest` trae Chrome preinstalado).

## Interfaz: The Living Canvas

Dos vistas sin router (hash): la **landing** (`/`) y el **estudio** (`#/estudio`),
cada una en su propio chunk (la landing nunca descarga Monaco; el estudio nunca
descarga Three.js).

- `src/landing/` — hero con escultura 3D procedural (`HeroSculpture` →
  `scene/SculptureCanvas`, react-three-fiber), playground real
  (`InteractivePlayground`), galería (`ExampleGallery`), historia sticky
  (`HowItWorks`), IA creativa (`CreativeAISection`) y CTA final. Todo lo que se
  dibuja lo compila el compilador real en el Web Worker compartido
  (`compiler/sharedCompiler.ts`); no hay SVG pre-renderizados.
- `src/studio/` — `StudioWorkspace` (explorador · editor + problemas · resultado),
  paneles redimensionables con ratón o teclado (`Splitter`), atajos
  (`useShortcuts`, ver el icono de teclado en la cabecera), autoguardado en el
  navegador (`useLocalProject`) y vista de una sola columna con barra inferior
  en móvil.
- `src/styles/` — `tokens.css` (paleta, tipografía fluida, sombras duras),
  `landing.css`, `studio.css`.

**Animaciones al scroll: solo CSS** (`animation-timeline: view()/scroll()`,
`animation-range`, `view-timeline` nombrado, `position: sticky`). Van dentro de
`@supports (animation-timeline: view())` y
`@media (prefers-reduced-motion: no-preference)`: sin soporte o con movimiento
reducido el contenido se ve completo y estático. No hay listeners de scroll ni
librerías de animación.

**3D**: carga diferida cuando el navegador está ocioso, `dpr` limitado, pausa
fuera del viewport (`frameloop: "never"`), versión reducida en pantallas
pequeñas y *fallback* SVG estático si no hay WebGL, el dispositivo es de poca
potencia o el usuario prefiere movimiento reducido (con botón para activarlo).

Dependencias añadidas: `three`, `@react-three/fiber` (React 18 → v8) y
`@react-three/drei` (solo `Float` y `Outlines`). Justificación: la escultura es
el protagonista del hero; se cargan en un chunk aparte (~223 kB gzip) y solo en
la landing.

## DSL Studio 2.0 (lenguaje 2.0.0)

Novedades de esta rama (`feature/dsl-studio-2`):

- **Lenguaje 2.0**: `const`/`let`, expresiones, funciones matemáticas, `para`,
  `si`/`sino`, `funcion`/`retornar`, `grupo` y `diagrama`. Los programas 1.x
  compilan igual (el test `tests/legacyCompat.test.ts` compara byte a byte los
  8 presets originales con `compiler-core` 0.2.0).
- **Editor visual bidireccional**: seleccionar, arrastrar, mover con flechas e
  inspector; cada gesto reescribe solo los argumentos afectados (los
  comentarios se conservan) y es un único paso de deshacer.
- **Diagramas con auto-layout** (`diagrama flujo|arquitectura|organigrama|proceso|red`):
  posiciones automáticas o fijadas a mano, y "Volver al layout automático".
- **Asistente de IA** (generar / modificar / explicar): la propuesta se valida
  compilándola en el backend, se muestra como diff y nunca reemplaza el código
  sin aceptar. La API key vive solo en el backend.

### Ejecutar en local (frontend + backend)

El frontend instala automáticamente el snapshot de `compiler-core` con
lenguaje 2.0 incluido en `vendor/`. El enlace local es opcional cuando se
modifica el compilador en paralelo:

```bash
# 1) Backend (otro repo): construir y levantar
cd ../DSLCompiler_Backend
npm ci && npm run build
cp .env.example .env            # opcional: ANTHROPIC_API_KEY para el asistente
docker compose up -d --build    # gateway en http://localhost:4000

# 2) Frontend: enlazar el compiler-core local y arrancar
cd ../CompilerIMG
npm install
npm run core:local              # opcional; npm ci restaura el snapshot fijado
npm run dev                     # http://localhost:5173
```

El chip "Lenguaje X.Y.Z" del pie compara la versión del Web Worker con la del
backend (`/api/ai/health`); si difieren se marca en ámbar.

### Variables de entorno

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `GATEWAY_URL` | contenedor del frontend (runtime) | URL pública del gateway |
| `VITE_GATEWAY_URL` | `npm run dev` / `vite build` | igual, en build-time (por defecto `http://localhost:4000`) |
| `LEGACY_CORE_DIST` | solo tests | ruta al `dist/index.js` de compiler-core 0.2.0 para el test de compatibilidad 1.x (sin ella se omite) |
| `ANTHROPIC_API_KEY` | **solo backend** (`ai-assist`) | nunca llega al navegador; vacío = el asistente responde que no está configurado |
| `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS` (2048), `ANTHROPIC_TIMEOUT_MS` (30000) | backend `ai-assist` | modelo y control de tokens/tiempo |
| `ASSIST_MAX_ATTEMPTS` (3), `ASSIST_DEADLINE_MS` (45000), `ASSIST_MAX_OUTPUT_CHARS` (12000) | backend `ai-assist` | reintentos de validación, plazo total y tamaño máximo de la propuesta |
| `AI_RATE_LIMIT_MAX` (10), `AI_RATE_LIMIT_WINDOW_MS` | gateway | límite de peticiones a `/api/ai/assist` |

### Despliegue

Gateway y compilador siguen en Render; el frontend estático se despliega
en Vercel con `VITE_GATEWAY_URL`. No se despliega ningún servidor gRPC en
Vercel. El snapshot de `vendor/` permite desplegar el lenguaje 2.0 sin
publicar una nueva versión del paquete en npm. Actualiza el backend al
commit indicado en `vendor/README.md` para mantener ambas versiones alineadas.

## Por qué el compile-preview no pasa por el gateway

Compilar a SVG no tiene efectos secundarios ni necesita autenticación ni
rate limiting server-side — es puro cómputo determinista, así que correrlo
en un Worker local da preview instantáneo (cero latencia de red) sin perder
nada: es literalmente el mismo paquete (`@saramariaojeda9559/compiler-core`)
que corre en `services/compiler` del backend. El gateway solo entra en
juego para lo que de verdad requiere el backend: rasterizar a PNG
(`sharp`), sugerencias de IA, y guardar/cargar proyectos.
