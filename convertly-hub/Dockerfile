FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder

COPY . .
RUN npx prisma generate && npm run build

FROM dependencies AS migration

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts/seed-first-admin.mjs ./scripts/seed-first-admin.mjs
COPY scripts/plan-sync-core.cjs ./scripts/plan-sync-core.cjs
COPY scripts/sync-user-plan.mjs ./scripts/sync-user-plan.mjs
COPY scripts/guest-quota-reset-core.mjs ./scripts/guest-quota-reset-core.mjs
COPY scripts/reset-guest-quota.mjs ./scripts/reset-guest-quota.mjs
RUN npx prisma generate

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001

CMD ["node", "server.js"]
