FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifest and lockfile
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace package manifests for the server and its type dependency
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/

# Reproducible install
RUN npm ci

# Copy source for packages needed to build the server
# @secret-capsule/types is types-only (no build step), just copy its source
COPY packages/types/src/ ./packages/types/src/
COPY apps/server/src/ ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/

# Build the server (tsc resolves @secret-capsule/types from source via paths)
RUN npm run build --workspace=@secret-capsule/server

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/apps/server/package.json ./apps/server/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built server output
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# @secret-capsule/types is types-only — no dist needed at runtime
# (all types are erased after TypeScript compilation)

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
