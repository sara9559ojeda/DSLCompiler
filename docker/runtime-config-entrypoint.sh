#!/bin/sh
# Dropped into /docker-entrypoint.d/ — the official nginx image runs every
# executable script there (alphabetically) before starting nginx. Only
# $GATEWAY_URL is substituted (explicit var list), so nothing else in the
# template is touched even if it ever contains other '$' characters.
set -eu
envsubst '${GATEWAY_URL}' \
  < /usr/share/nginx/html/runtime-config.js.template \
  > /usr/share/nginx/html/runtime-config.js
