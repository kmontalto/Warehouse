FROM node:22-alpine AS base

# --- Build stage ---
FROM base AS builder
WORKDIR /app

# Install OpenSSL so Prisma can detect the correct engine (OpenSSL 3.x)
RUN apk add --no-cache openssl

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

# --- Production stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install OpenSSL for Prisma engine compatibility at runtime
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files (schema + migrations for running migrate on start)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

# Copy the startup script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Create data directory for SQLite and give nextjs user ownership
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data /app/prisma

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
