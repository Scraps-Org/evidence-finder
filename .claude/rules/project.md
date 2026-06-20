# 🚀 nextjs-service-template — 프로젝트 고유 규약

> 사고 원칙: [`~/.claude/rules/thinking.md`](../../../.claude/rules/thinking.md)
> 협업 규약: [`~/.claude/rules/collaboration.md`](../../../.claude/rules/collaboration.md)

---

## 🎯 절대 규칙 (이 프로젝트 한정)

1. **시크릿 하드코딩 금지.** 클라이언트 노출은 `process.env.NEXT_PUBLIC_*` (Next 가 자동 인라인), 서버 전용은 `process.env.<KEY>` (Server Component / API Route / route handler) + `.env.example` 키 추가.
2. **`NEXT_PUBLIC_*` 접두사가 붙은 환경변수는 클라이언트 번들에 포함된다.** 시크릿(서버 키, DB URL 등) 에는 절대 `NEXT_PUBLIC_` 안 붙임.

(공통 절대 규칙은 `collaboration.md`.)

---

## 📦 패키지 매니저: pnpm 전용

- **`pnpm` 만.** `npm`, `yarn`, `bun` 사용 금지.
- 락파일 `pnpm-lock.yaml` 반드시 커밋.
- `engines.node: ">=22"` + `packageManager` 필드 고정.
- `pnpm add <pkg>` / `pnpm add --save-dev <pkg>`
- 새 의존성 PR **New Dependencies** 섹션에 라이선스 + 번들 영향 ([bundlephobia.com](https://bundlephobia.com)) + 유지보수 명시.

---

## 🧪 테스트 / 린트 / 타입체크

```bash
pnpm lint        # eslint + prettier --check
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm build       # next build
```

- **ESLint flat config** + `eslint-config-next` (next/core-web-vitals + next/typescript)
- **Prettier** (Astro plugin 불필요 — TSX 만)
- **TypeScript strict** + `noUncheckedIndexedAccess`
- **Vitest** + `@vitejs/plugin-react` + jsdom + RTL (`@testing-library/react`)

---

## 🔧 환경변수 / 시크릿

| 상황 | 명령 |
|---|---|
| 로컬 `.env` | `make dev` (`process.env` 또는 Next inline `NEXT_PUBLIC_*`) |
| Vercel | 대시보드 Project → Settings → Environment Variables |
| 새 환경변수 | (1) `.env` 에 값 (2) `.env.example` 키만 (3) 클라이언트 노출이면 `NEXT_PUBLIC_*` |

`.env` 절대 커밋 금지 (gitleaks 차단).

---

## 📂 프로젝트 구조

```
src/
  app/                       # App Router (RSC 기본)
    layout.tsx               # Root Layout (html/body)
    page.tsx                 # /
    globals.css              # @import 'tailwindcss'
    api/<route>/route.ts     # Route Handlers (필요 시)
  components/                # 재사용 컴포넌트
public/                      # 정적 자산
tests/                       # Vitest + RTL
```

import alias `~/*` → `src/*`.

---

## 🎨 Next.js App Router 한정 패턴

- **Server Components 기본**, `'use client'` 디렉티브로 부분 client 만 격리
- **`Metadata` API** — `export const metadata: Metadata = { ... }` (layout / page)
- **Route Handlers** — `app/api/<route>/route.ts` 안 `GET` / `POST` named export
- **`next/image`** 권장 (자동 최적화). `priority` 신중히
- **`next/link`** — internal 라우트는 `<Link>`, external 은 `<a>`
- **`output: 'standalone'`** (next.config.mjs) — Docker 안 최소 런타임

---

## 🚫 자주 하는 실수 (이 프로젝트 한정)

| 실수 | 올바른 방식 |
|---|---|
| `npm install <pkg>` | `pnpm add <pkg>` |
| `node_modules/.bin/<cmd>` | `pnpm exec <cmd>` |
| `.env` 를 `git add` | 절대 금지. gitleaks 차단 |
| 시크릿에 `NEXT_PUBLIC_*` | 클라이언트 노출! 서버 전용은 prefix 빼기 |
| Server Component 안 `useState` | `'use client'` 디렉티브 추가 또는 분리 |
| `<a href="/about">` (internal) | `<Link href="/about">` |
| `pnpm-lock.yaml` 커밋 누락 | 필수 커밋 |
| `next/image` 없이 `<img>` 직접 | `next/image` 권장 (자동 최적화) |
