FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all workspaces package files
COPY apps/server/package.json ./apps/server/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/types/package.json ./packages/types/
COPY packages/crypto-utils/package.json ./packages/crypto-utils/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build backend server and its dependent workspaces
RUN npm run build --workspace=@secret-capsule/types && \
    npm run build --workspace=@secret-capsule/crypto-utils && \
    npm run build --workspace=@secret-capsule/ui && \
    npm run build --workspace=@secret-capsule/server

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
