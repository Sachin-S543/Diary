FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the server
RUN npm run build --workspace=@secret-capsule/server

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy only needed files from builder
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/apps/server/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
