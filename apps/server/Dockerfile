FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifest and lockfile first (layer-cache friendly)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy only the package manifests for workspaces the server depends on
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/

# npm ci uses the lockfile for a reproducible, clean install
# --ignore-scripts prevents lifecycle scripts from running during install
RUN npm ci

# Copy source for only the packages we need to build
COPY packages/types/ ./packages/types/
COPY apps/server/ ./apps/server/

# Build in dependency order: types first, then server
RUN npm run build --workspace=@secret-capsule/types
RUN npm run build --workspace=@secret-capsule/server

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests and lockfile so npm ci works in production stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/apps/server/package.json ./apps/server/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built server output
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
