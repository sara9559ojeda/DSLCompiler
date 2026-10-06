# Build context is the monorepo root (see docker-compose.yml).
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/compiler/package.json services/compiler/package.json
COPY services/projects/package.json services/projects/package.json
COPY services/ai-assist/package.json services/ai-assist/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
# No gateway URL baked in here on purpose — see docker/runtime-config.js.template.
# Render's Blueprint format has no way to pass Docker build args, and baking
# an absolute URL in at build time would mean one image per deploy target.
COPY packages/shared packages/shared
COPY services/compiler services/compiler
COPY apps/web apps/web
RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=services/compiler \
 && npm run build --workspace=apps/web

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# The gateway's public URL is resolved at container *start*, not build time
# (see src/config/app.config.ts): this script (run automatically by the
# base image's entrypoint, from /docker-entrypoint.d/) renders
# runtime-config.js from $GATEWAY_URL just before nginx starts.
COPY apps/web/docker/runtime-config.js.template /usr/share/nginx/html/runtime-config.js.template
COPY apps/web/docker/runtime-config-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80
