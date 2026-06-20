---
description: Linear 이슈를 받아 브랜치 → 구현 → 커밋 → PR 까지 한 번에 처리
argument-hint: <linear-issue-id> (예: SCR-123)
---

# /work-issue

Linear 이슈 `$ARGUMENTS` 를 처리한다. 다음 순서를 **그대로** 따른다.

## 1. 이슈 컨텍스트 로드

Linear MCP 로 `$ARGUMENTS` 의 다음 정보:

- 제목, 설명, 우선순위
- 라벨 (특히 `bug` / `feature` / `improvement`)
- 연결된 이슈 / 관련 PR
- 댓글

이슈 정보가 부족하면 사용자에게 질문. **추측으로 진행 X.**

## 2. 상태 변경

Linear MCP 로 이슈 → `In Progress`.

## 3. 브랜치 분기

```bash
git checkout main && git pull --rebase
git checkout -b <type>/<linear-id-소문자>-<kebab-description>
```

`type` (라벨 기반):

- `bug` → `fix`
- `feature` → `feat`
- `improvement` → `refactor` / `perf`
- 그 외 → 이슈 제목으로 추론

## 4. 구현

- `CLAUDE.md` 코딩 규약 준수
- 기존 코드 스타일/패턴 우선
- 새 의존성: `pnpm add <pkg>` (또는 `pnpm add --save-dev`)
- 새 환경변수: `.env.example` 에도 추가 + `PUBLIC_*` 접두사 규칙 확인

## 5. 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

**모두 통과해야** 다음. 실패 시 수정 후 재시도.

## 6. 커밋

Conventional Commits + footer `Closes $ARGUMENTS` 또는 `Refs $ARGUMENTS`.

```
<type>(<scope>): <subject>

<왜 변경했는가 — 2~4줄>

Closes $ARGUMENTS
```

## 7. PR 생성

```bash
git push -u origin HEAD --force-with-lease
gh pr create --fill --draft
```

PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 모든 섹션. CI 그린이면 `gh pr ready`.

## 8. Linear 업데이트

- PR 링크 코멘트
- 상태 → `In Review`

## 9. 보고

사용자에게 요약:

- 브랜치명
- 커밋 메시지
- PR URL
- Linear 이슈 URL
- 다음에 사람이 할 일 (리뷰어 지정 / 추가 컨텍스트 / 베타 테스트)
