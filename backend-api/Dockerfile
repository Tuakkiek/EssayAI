# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

# Healthcheck so Docker / orchestrators know when we're ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
