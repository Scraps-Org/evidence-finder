# syntax=docker/dockerfile:1.7
# Next.js standalone build → Node 22 alpine 런타임. 경량화 multi-stage:
# - Builder: node:22-alpine (~75MB) + BuildKit pnpm-store 캐시 마운트
# - Runtime: node:22-alpine (~75MB) + 비-root user 1001 + standalone 산출만
# 최종 이미지 ~150MB.
#
# distroless (gcr.io/distroless/nodejs22-debian12) 도 후보지만 alpine 이 더 가볍고
# debug 시 셸 사용 가능 (distroless 는 셸 X). 보안 우선이면 distroless 로 교체.

ARG NODE_VERSION=22

# ─── 1. Builder: pnpm install (cache mount) + next build ──
FROM node:${NODE_VERSION}-alpine AS builder
ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat \
    && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile || pnpm install

COPY . .
RUN pnpm run build

# ─── 2. Runtime: distroless Node 22 (~110MB) + standalone ──
# distroless 는 셸·apt 없음 — 가장 작고 안전. 디버그 필요 시 runtime 을
# `node:22-alpine` 으로 교체하거나 별도 debug stage 추가.
# 비-root 기본 (uid 65532 nonroot user — distroless 제공).
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder --chown=65532:65532 /app/public ./public
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static

EXPOSE 3000

# distroless 의 ENTRYPOINT 는 ["/nodejs/bin/node"] 로 고정 — CMD 만 지정
CMD ["server.js"]
