# Build context MUST be the repository root (see docker-compose.yml).
FROM node:20-alpine AS builder
WORKDIR /app

COPY services/payment-service/package.json services/payment-service/package-lock.json* ./services/payment-service/
COPY build/smithy/typescript-payment-processor-server/typescript-server-codegen ./build/smithy/typescript-payment-processor-server/typescript-server-codegen
COPY build/smithy/typescript-payment-contracts-client/typescript-client-codegen ./build/smithy/typescript-payment-contracts-client/typescript-client-codegen

WORKDIR /app/services/payment-service
RUN npm install --no-audit --no-fund \
 && npm install --no-save --no-audit --no-fund esbuild@^0.21.5

COPY services/payment-service/tsconfig.json ./
COPY services/payment-service/src ./src

# Bundle the HTTP server entrypoint AND the migration runner.
RUN npx esbuild src/index.ts \
      --bundle --platform=node --target=node20 --format=cjs \
      --packages=external --tsconfig=tsconfig.json \
      --outfile=dist/index.js \
 && npx esbuild src/db/migrate.ts \
      --bundle --platform=node --target=node20 --format=cjs \
      --packages=external --tsconfig=tsconfig.json \
      --outfile=dist/db/migrate.js

# migrate.ts reads `<__dirname>/migrations/001_init.sql` — copy the SQL next to it.
RUN mkdir -p dist/db/migrations && cp src/db/migrations/*.sql dist/db/migrations/

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/services/payment-service/package.json ./package.json
COPY --from=builder /app/services/payment-service/node_modules ./node_modules
COPY --from=builder /app/services/payment-service/dist ./dist

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3001
# Idempotent migration runs on every start (CREATE TABLE IF NOT EXISTS).
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
