FROM node:20-alpine AS builder

WORKDIR /app

# ── Layer 1: workspace manifests + lockfile (cached until deps change) ─────────
COPY package*.json ./
COPY tsconfig.base.json ./

# All workspace package.json files must be present for `npm ci` to
# resolve the lockfile correctly (lockfile was generated with all workspaces).
COPY packages/types/package.json      ./packages/types/
COPY packages/crypto-utils/package.json ./packages/crypto-utils/
COPY packages/ui/package.json         ./packages/ui/
COPY apps/server/package.json         ./apps/server/
COPY apps/frontend/package.json       ./apps/frontend/

# ── Layer 2: install (cached until any package.json / lockfile changes) ────────
RUN npm ci

# ── Layer 3: source code ───────────────────────────────────────────────────────
# Copy only the packages the server needs to compile.
# NOTE: trailing-slash destination keeps directory structure intact.
COPY packages/types/src/   ./packages/types/src/
COPY apps/server/src/      ./apps/server/src/
COPY apps/server/tsconfig.json ./apps/server/

# ── Layer 4: build ─────────────────────────────────────────────────────────────
# tsc resolves @secret-capsule/types directly from source via tsconfig paths —
# no separate build step needed for the types-only package.
RUN npm run build --workspace=@secret-capsule/server

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Workspace manifests + lockfile needed for production install
COPY --from=builder /app/package*.json            ./
COPY --from=builder /app/packages/types/package.json      ./packages/types/
COPY --from=builder /app/packages/crypto-utils/package.json ./packages/crypto-utils/
COPY --from=builder /app/packages/ui/package.json         ./packages/ui/
COPY --from=builder /app/apps/server/package.json         ./apps/server/
COPY --from=builder /app/apps/frontend/package.json       ./apps/frontend/

# Production-only install (no devDependencies)
RUN npm ci --omit=dev

# Compiled server output (types are erased after tsc — no dist/ needed for types)
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
