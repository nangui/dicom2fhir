# Dev image for api and web: Node + pnpm only. Source and deps are mounted by compose.
FROM node:24.21.0-alpine3.24

RUN npm install -g pnpm@10.30.0 && npm cache clean --force

# Named volumes copy ownership from the image path when first created,
# so pre-create every node_modules mount point owned by the non-root user.
RUN mkdir -p /repo/node_modules /repo/apps/api/node_modules /repo/apps/web/node_modules \
      /repo/packages/core/node_modules /pnpm/store \
  && chown -R node:node /repo /pnpm

# CI=true keeps pnpm non-interactive (no TTY in containers).
ENV npm_config_store_dir=/pnpm/store \
    CI=true

USER node
WORKDIR /repo
