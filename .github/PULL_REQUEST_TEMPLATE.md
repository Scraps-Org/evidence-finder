<!--
PR 제목 형식: <type>(<scope>): <subject> (SCR-XXX)
예: feat(home): Hero 섹션 추가 (SCR-123)
-->

## Why
<!-- 1~2문장. 이 변경이 왜 필요한가? 어떤 문제/요구사항을 해결하나? -->


## What
<!-- bullet으로 변경사항 요약. "코드에서 보이는 것"보다는 의미 단위로. -->
-
-

## How to Test
<!-- 리뷰어가 5분 안에 검증할 수 있는 절차. -->
1. `pnpm install`
2. `pnpm dev` → 브라우저 `http://localhost:3000`
3.

## Screenshots
N/A

## Breaking Changes
None

## New Dependencies
None

## Checklist
- [ ] 브랜치명이 `<type>/<linear-id>-<kebab-description>` 형식
- [ ] PR 제목이 Conventional Commits + `(SCR-XXX)` 포함
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 로컬 통과
- [ ] 새 환경변수가 있다면 `.env.example` 갱신 (`NEXT_PUBLIC_*` 접두사 클라이언트 노출 정합)
- [ ] 공개 API/동작이 바뀌었다면 README/주석 갱신
- [ ] 변경 라인 수가 400줄 이하 (Phase long-lived 예외)
- [ ] `.env`, 시크릿, API 키 누출 없음

Closes SCR-XXX
