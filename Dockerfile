# Standalone build — no monorepo context needed. @saramariaojeda9559/compiler-core
# installs from the public npm registry (published, pre-built dist/), not
# from a sibling workspace package.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
# No gateway URL baked in here on purpose — see docker/runtime-config.js.template.
# Render's Blueprint format has no way to pass Docker build args, and baking
# an absolute URL in at build time would mean one image per deploy target.
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# The gateway's public URL is resolved at container *start*, not build time
# (see src/config/app.config.ts): this script (run automatically by the
# base image's entrypoint, from /docker-entrypoint.d/) renders
# runtime-config.js from $GATEWAY_URL just before nginx starts.
COPY docker/runtime-config.js.template /usr/share/nginx/html/runtime-config.js.template
COPY docker/runtime-config-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80
