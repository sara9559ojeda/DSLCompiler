# @compiler-img/web

Editor + previsualización en vivo + exportación. Conecta al
[gateway](../gateway) para exportar PNG; compila SVG en vivo enteramente en
el navegador, sin red.

## Diseño (INP < 200ms)

- **Compilación en Web Worker**: `src/compiler/compiler.worker.ts` importa
  `@compiler-img/compiler/browser` (el mismo Lexer/Parser/SemanticAnalyzer/
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
Render no soporta pasar build args de Docker vía `render.yaml` (ver
[docs/deploy-render.md](../../docs/deploy-render.md)).

## Desarrollo

```bash
cp .env.example .env
npm install
npm run dev        # necesita el gateway (y a través de él, el compiler service) corriendo para exportar PNG
npm test
npm run typecheck
```

## E2E (Playwright)

Corre contra un build ya levantado — no arranca un dev server propio. Por
defecto apunta a `http://localhost:8080` (el `web` de `docker-compose`);
override con `E2E_BASE_URL` para apuntar a `npm run dev` (`:5173`) u otro
destino.

```bash
docker compose up -d --build   # desde la raíz del repo
npm run e2e                     # desde apps/web
```

Usa el canal `chrome` del sistema (no descarga un Chromium propio) — tanto
en local como en CI (`ubuntu-latest` trae Chrome preinstalado).

## Por qué el compile-preview no pasa por el gateway

Compilar a SVG no tiene efectos secundarios ni necesita autenticación ni
rate limiting server-side — es puro cómputo determinista, así que correrlo
en un Worker local da preview instantáneo (cero latencia de red) sin perder
nada: es literalmente el mismo código que corre en `services/compiler`. El
gateway solo entra en juego para lo que de verdad requiere el backend:
rasterizar a PNG (`sharp`) y, a futuro, guardar/cargar proyectos.
