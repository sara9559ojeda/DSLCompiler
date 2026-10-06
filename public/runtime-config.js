// Local-dev / static-hosting default: no runtime override. In the Docker
// image this exact path is regenerated at container startup from
// docker/runtime-config.js.template (see docker-entrypoint.sh) — the same
// built image can then point at any gateway URL without rebuilding.
window.__RUNTIME_CONFIG__ = {};
