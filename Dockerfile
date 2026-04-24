FROM cgr.dev/chainguard/node:latest-dev AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM cgr.dev/chainguard/node:latest-dev AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM cgr.dev/chainguard/node:latest
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node_modules/next/dist/bin/next", "start"]
