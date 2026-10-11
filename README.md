# DSLCompiler — Frontend

Editor + previsualización en vivo + exportación para el Compilador de
Imágenes (DSL de figuras → SVG/PNG). Consume el backend
([`DSLCompiler_Backend`](https://github.com/sara9559ojeda/DSLCompiler_Backend))
por HTTP para exportar PNG, y compila a SVG en vivo enteramente en el
navegador usando [`@saramariaojeda9559/compiler-core`](https://www.npmjs.com/package/@saramariaojeda9559/compiler-core)
(publicado en npm, instalado como una dependencia normal — no vía
workspace).

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

## Por qué el compile-preview no pasa por el gateway

Compilar a SVG no tiene efectos secundarios ni necesita autenticación ni
rate limiting server-side — es puro cómputo determinista, así que correrlo
en un Worker local da preview instantáneo (cero latencia de red) sin perder
nada: es literalmente el mismo paquete (`@saramariaojeda9559/compiler-core`)
que corre en `services/compiler` del backend. El gateway solo entra en
juego para lo que de verdad requiere el backend: rasterizar a PNG
(`sharp`), sugerencias de IA, y guardar/cargar proyectos.
