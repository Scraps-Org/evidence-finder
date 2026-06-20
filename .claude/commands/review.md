---
description: 현재 브랜치의 변경사항을 셀프 리뷰하고 PR 올릴 준비가 됐는지 확인
---

# /review

현재 브랜치를 PR 로 올리기 전 셀프 리뷰를 수행한다.

## 1. Diff 확인

```bash
git fetch origin main
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

## 2. 체크리스트

다음 항목을 **하나씩** 검증하고 보고한다:

- [ ] **변경 라인 수가 400줄 이하** (Phase long-lived 예외)
- [ ] **하나의 책임** 만 다루는가 (리팩토링 + 기능 분리)
- [ ] 모든 커밋 메시지가 **Conventional Commits 형식** + Linear ID footer
- [ ] `.env`, 시크릿, API 키가 **누출되지 않았는가**?
- [ ] **테스트가 추가/수정** 됐는가? 새 코드 경로에 대한 커버리지
- [ ] **`.env.example` 갱신** (새 환경변수가 있다면)
- [ ] **README/주석 갱신** (공개 API 가 바뀌었다면)
- [ ] **Breaking change** 가 있다면 명시
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 모두 통과

## 3. 코드 품질 점검

- TODO/FIXME 새로 추가하지 않았는가? (있다면 Linear 이슈로)
- `console.log()`, 디버그 코드 잔존 X (`console.warn` / `console.error` 는 OK)
- 주석 처리된 죽은 코드 X
- 매직 넘버를 상수로 추출
- `any` 타입 도입 안 했는가? (도입했다면 사유)
- `client:load` 남발 X (`client:visible` / `client:idle` 가능 시 그쪽)
- 에러 처리 적절 (silent except 금지)

## 4. 결과 보고

문제가 있다면 `파일명:라인` 으로. 모두 통과하면 `gh pr ready` 제안.
