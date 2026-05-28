# Build context MUST be the repository root (see docker-compose.yml).
# We use esbuild to bundle the service + generated Smithy packages into a single
# self-contained file — Node has no tsconfig path-mapping support at runtime.
FROM node:20-alpine AS builder
WORKDIR /app

COPY services/tweet-service/package.json services/tweet-service/package-lock.json* ./services/tweet-service/
COPY build/smithy/typescript-server/typescript-server-codegen ./build/smithy/typescript-server/typescript-server-codegen
COPY build/smithy/typescript-payment-gateway-server/typescript-server-codegen ./build/smithy/typescript-payment-gateway-server/typescript-server-codegen
COPY build/smithy/typescript-payment-contracts-client/typescript-client-codegen ./build/smithy/typescript-payment-contracts-client/typescript-client-codegen

WORKDIR /app/services/tweet-service
RUN npm install --no-audit --no-fund \
 && npm install --no-save --no-audit --no-fund esbuild@^0.21.5

COPY services/tweet-service/tsconfig.json ./
COPY services/tweet-service/src ./src

# --packages=external keeps node_modules deps out of the bundle (smaller, faster);
# the generated Smithy packages are resolved via tsconfig paths and DO get inlined.
RUN npx esbuild src/index.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --format=cjs \
      --packages=external \
      --tsconfig=tsconfig.json \
      --outfile=dist/index.js

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/services/tweet-service/package.json ./package.json
COPY --from=builder /app/services/tweet-service/node_modules ./node_modules
COPY --from=builder /app/services/tweet-service/dist ./dist

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000
CMD ["node", "dist/index.js"]
