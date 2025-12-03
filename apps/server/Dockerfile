FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all workspaces package files
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
COPY packages/crypto-utils/package.json ./packages/crypto-utils/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build types first
RUN npm run build -w packages/types

# Build server
RUN npm run build -w apps/server

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
