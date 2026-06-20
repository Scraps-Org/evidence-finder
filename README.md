# nextjs-service-template

> 새 Next.js 프로젝트를 **5분 안에** 시작할 수 있도록 만든 범용 템플릿입니다.
> Docker, pnpm, ESLint flat (next/typescript + next/core-web-vitals), Prettier, TypeScript strict, Vitest + RTL, Tailwind 4, Vercel native, pre-commit, GitHub + Linear, Claude Code.

---

## ✨ 무엇이 들어 있나

| 영역 | 도구 / 설정 |
|---|---|
| **프레임워크** | [Next.js 15](https://nextjs.org) App Router (`output: 'standalone'`) |
| **언어** | TypeScript strict + `noUncheckedIndexedAccess` + `isolatedModules` |
| **패키지 매니저** | [pnpm](https://pnpm.io) (락파일 커밋 필수, Node 22 LTS) |
| **CSS** | [Tailwind 4](https://tailwindcss.com) (`@tailwindcss/postcss`) |
| **린트 / 포맷** | [ESLint flat](https://eslint.org) (eslint-config-next) + [Prettier](https://prettier.io) |
| **타입 체크** | `tsc --noEmit` (Next plugin 자동 포함) |
| **테스트** | [Vitest](https://vitest.dev) + jsdom + [@testing-library/react](https://testing-library.com) |
| **사전 검사** | [pre-commit](https://pre-commit.com) — gitleaks · eslint · prettier · tsc · conventional-pre-commit |
| **컨테이너** | Docker (멀티스테이지 + 비-root + Next standalone) + docker compose |
| **개발 환경** | VS Code Dev Container (`.devcontainer/`) |
| **배포** | Vercel native (Docker 도 동시 지원) |
| **이슈 / 협업** | Linear MCP, PR 템플릿, Conventional Commits |
| **AI 협업** | Claude Code (`CLAUDE.md`, `.claude/commands/`) |

---

## 📁 프로젝트 구조

```
.
├── .claude/                  # Claude Code 팀 설정
│   ├── commands/{review.md, work-issue.md}
│   ├── rules/{init.md, project.md}
│   └── settings.json
├── .devcontainer/            # VS Code Dev Container
├── .github/
│   ├── workflows/{ci.yml, claude.yml}
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                   # 정적 자산 (favicon 등)
├── src/
│   ├── app/                  # App Router
│   │   ├── layout.tsx        # Root Layout
│   │   ├── page.tsx          # /
│   │   └── globals.css       # @import 'tailwindcss'
│   └── components/Welcome.tsx
├── tests/                    # Vitest + RTL
│   ├── setup.ts              # @testing-library/jest-dom + cleanup
│   └── Welcome.test.tsx
├── next.config.mjs           # Next 15 + standalone + typedRoutes
├── tsconfig.json             # TypeScript strict + Next plugin
├── eslint.config.mjs         # ESLint flat + next/typescript
├── vitest.config.mts
├── postcss.config.mjs        # @tailwindcss/postcss
├── package.json + pnpm-lock.yaml
├── .env.example .editorconfig .gitignore .npmrc .pre-commit-config.yaml .prettierrc.json .prettierignore .dockerignore
├── Dockerfile + docker-compose.yml
├── Makefile
├── CLAUDE.md
└── README.md
```

---

## 🚀 빠른 시작

### A. 로컬 (pnpm 직접)

> Node 22 LTS + pnpm. corepack 권장:
>
> ```bash
> corepack enable && corepack prepare pnpm@latest --activate
> ```

```bash
git clone <이 레포 URL> my-app
cd my-app

pnpm install
pnpm exec pre-commit install
cp .env.example .env

make dev                       # → http://localhost:3000
```

### B. VS Code Dev Container

> Docker Desktop + "Dev Containers" 확장.

1. clone 후 VS Code 로 열기 → **"Reopen in Container"**
2. `post-create.sh` 자동 실행 — pnpm install, pre-commit, .env
3. `make dev`

### C. Docker

```bash
git clone <이 레포 URL> my-app
cd my-app
cp .env.example .env

make docker-build              # 이미지 빌드
make docker-run                # 단발 실행 → http://localhost:3000
# 또는
make up && make logs && make down
```

---

## 🛠 자주 쓰는 명령어 (Makefile)

```bash
make help            # 전체 목록
make install         # pnpm install
make dev             # install + pre-commit + next dev (3000)
make build           # next build → .next/standalone
make start           # production 모드 실행
make lint            # eslint + prettier --check
make format          # prettier --write + eslint --fix
make typecheck       # tsc --noEmit
make test            # vitest run
make cov             # vitest --coverage
make clean           # 캐시 / 빌드 산출물 제거
make docker-build / docker-run / up / down / logs
```

---

## 📦 새 의존성 추가

```bash
pnpm add <package>
pnpm add --save-dev <package>
```

`pnpm-lock.yaml` 자동 갱신 — **반드시 커밋**.

---

## 🔐 시크릿 / 환경변수

| 상황 | 명령 |
|---|---|
| 로컬 `.env` | `make dev` (Next 가 `process.env` 로 읽음) |
| Vercel | 대시보드 Project → Settings → Environment Variables |
| 새 환경변수 | (1) `.env` 에 값 (2) `.env.example` 키만 (3) 클라이언트 노출이면 `NEXT_PUBLIC_*` 접두사 |

> ⚠️ `.env` 절대 커밋 금지. gitleaks 훅 차단.
> ⚠️ `NEXT_PUBLIC_*` 는 클라이언트 번들에 포함됨. 시크릿에 절대 사용 금지.

---

## 🌱 이 템플릿을 내 프로젝트로

```bash
gh repo create my-app --template Scraps-Org/nextjs-service-template --private
gh repo clone my-app && cd my-app

# 1. 프로젝트 이름 갱신
sed -i 's/nextjs-service-template/my-app/g' \
  package.json README.md docker-compose.yml CLAUDE.md \
  .claude/rules/project.md

# 2. .env.example 정리
# 3. CLAUDE.md "규약 구성 가이드북" 안정화 후 docs/RULES.md 로 이동/삭제
```

---

## 🧪 워크플로

```
1. Linear 이슈 In Progress
2. main 에서 토픽 브랜치 (feat/scr-123-...)
3. 코드 작성 → pnpm add / .env.example 갱신
4. pnpm lint && pnpm typecheck && pnpm test && pnpm build PASS
5. git commit (Conventional Commits + Closes SCR-XXX)
6. git push --force-with-lease → gh pr create --fill --draft
7. CI 그린 → gh pr ready
```

---

## 🤖 Claude Code (선택)

| 명령 | 용도 |
|---|---|
| `/work-issue SCR-123` | 이슈 → 브랜치 → 구현 → PR |
| `/review` | 셀프 리뷰 |

GitHub Actions `@claude` 멘션: [.github/workflows/claude.yml](./.github/workflows/claude.yml).

---

## ❓ 문제 해결

| 증상 | 해결 |
|---|---|
| `pnpm: command not found` | `corepack enable && corepack prepare pnpm@latest --activate` |
| `node` 버전 mismatch | `engines.node: ">=22"` — Node 22 LTS 설치 |
| pre-commit 차단 | 메시지대로 수정 → 재 add → 재 commit. `--no-verify` 절대 금지 |
| Vercel 환경변수 누락 | 대시보드 Production / Preview / Development 분리 |
| `next build` 시 `not a valid Next.js project` | `next-env.d.ts` 가 .gitignore 가 아니더라도 `pnpm dev` 1회 후 재빌드 |

---

## 📜 라이선스

MIT.
