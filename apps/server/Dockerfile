FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build types first (if needed)
# RUN npm run build -w packages/types

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
