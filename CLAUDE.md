# CLAUDE.md — nextjs-service-template

> Claude Code가 이 레포에서 작업할 때 **반드시** 따라야 하는 규약입니다.
> 이 파일은 Claude Code 세션 시작 시 자동으로 로드되며, 아래 `@import`를 통해 글로벌 규약과 프로젝트 규약을 함께 적용합니다.

---

## 🚀 최초 셋업 (이 PC에서 처음이면)

`~/.claude/rules/thinking.md` · `~/.claude/rules/collaboration.md` 가 없으면 글로벌 규약 미적용. dotfiles-claude clone + symlink 셋업: <https://github.com/Scraps-Org/dotfiles-claude>

```bash
test -f "$HOME/.claude/rules/thinking.md" && test -f "$HOME/.claude/rules/collaboration.md" && echo "✓ ready" || echo "✗ run dotfiles-claude setup"
```

`.claude/rules/init.md` 도 참조.

---

## 📚 규약 구성 가이드북

본 레포는 `nextjs-service-template` 이자 **규약 작성법 가이드북**. 새 Next.js 프로젝트 시작 시 이 CLAUDE.md 복사해서 사용.

### 1️⃣ 3-tier 아키텍처

| Tier | 파일 | 범위 | 변경 빈도 |
|---|---|---|---|
| 1. 사고 원칙 | `~/.claude/rules/thinking.md` | 전 프로젝트 공통 | 매우 낮음 |
| 2. 협업 규약 | `~/.claude/rules/collaboration.md` | 전 프로젝트 공통, 외부 시스템 | 낮음 |
| 3. 프로젝트 규약 | `.claude/rules/project.md` | 이 레포 한정 | 보통 |

Tier 1·2 는 [`Scraps-Org/dotfiles-claude`](https://github.com/Scraps-Org/dotfiles-claude) 단일 출처, symlink 노출.

### 2️⃣ Decision Tree

```
다른 프로젝트(astro/python/...) 에서도 동일 적용?
├── NO  → tier 3
└── YES → 외부 시스템 협업?
          ├── YES → tier 2
          └── NO  → 코드/사고?
                    ├── YES → tier 1
                    └── NO  → 다시 검토. 보통 tier 3
```

### 3️⃣ 작성 스타일

짧고, 단언형, 검증 가능.

| ✅ | ❌ |
|---|---|
| `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 통과 | "좋은 코드" |
| PR 400줄 이하 | "적절한 크기" |
| `--force-with-lease` 만 (이유: 원격 덮어쓰기 방지) | "force push 조심" |

### 4️⃣ 새 프로젝트에서 사용

```bash
gh repo create my-app --template Scraps-Org/nextjs-service-template --private
gh repo clone my-app && cd my-app

sed -i 's/nextjs-service-template/my-app/g' \
  package.json README.md docker-compose.yml CLAUDE.md \
  .claude/rules/project.md
```

### 5️⃣ 안티패턴

| 안티 | 왜 | 대안 |
|---|---|---|
| 절대 규칙 20개+ | 무시됨 | 5~8개 |
| 모호어 | 검증 불가 | 수치 / 명령 |
| tier 중복 | drift | 가장 넓은 tier 만 |

---

@~/.claude/rules/thinking.md

@~/.claude/rules/collaboration.md

@.claude/rules/project.md

---

## 🔧 프로젝트 오버라이드 / 예외

(현재는 없음.)
