---
product: "evidence-finder"
owner: lean-startup-agent
status: active
updated: 2026-07-03
goal_version: d639ab1e071e
acceptance:
  - id: A-1
    hint: "Adding a URL to a case creates a Prisma Evidence row {url, detectedAt, pageTitle, domain, caseId}; a server route fetches the page to extract <title> + domain and stamps detectedAt; the evidence list renders URL + metadata only (no <img>/<video> pointing at the detected URL). next build + tsc --noEmit pass.\n"
    high_impact: false
  - id: PKG-HEALTH
    hint: "clean env 에서 프로젝트 표준 빌드+테스트 명령이 우회 없이 통과하고 패키지가 정상 빌드·실행된다 (python: `make test` 또는 `uv run pytest` — PYTHONPATH 우회 금지; node: package.json `packageManager` 기준 PM 으로 lockfile clean install+build+test, 예 `pnpm i --frozen-lockfile && pnpm build && pnpm test` 또는 `npm ci && npm run build && npm test`). 패키지명·레이아웃이 제품과 정합한다 — pyproject `name`·`packages`(python) 또는 package.json `name`(node)이 제품명이고, 템플릿 잔재(`python-service-template`·`src/app` 패키지·`nextjs-service-template` 등)가 남지 않는다."
    high_impact: true
---

# 기획서 — evidence-finder

> 목표 SoT (제품 repo 루트). lean 목표를 scraps 가 작성. evaluator 가 goal_ref 로 읽음.

## 목표 (1줄)

A web service for NCII (non-consensual intimate image) victims to locate URLs of posts exposing them and compile each into a report-ready evidence package — URL, detection timestamp, page title/domain — exportable as CSV for KCSC (방심위) review, takedown requests, and injunctions. URL/metadata- centric: the distributed content itself is never stored and never shown by default. Detection = best-effort surfacer of publicly-indexed exposure feeding a human-triage workflow.

## 빌드 맥락 (lean WHY)

- 배경: NCII victims currently have no systematic tool to document exposure URLs for legal action (KCSC filing, injunctions, takedown requests). The manual evidence spine requires D3 (manual URL add → Evidence row + metadata fetch) as its core gateway — D4/D5/D6/D7/D8 shipped atop D3's presumed Evidence model foundation, making this a fast-verification dispatch. BC-74 dispatched as inconclusive; D8-candidate-triage (BC-79, pass, shipped 2026-06-26) confirmed the Candidate→Evidence routing works, which depends on the same Evidence model D3 must establish end-to-end.
- 검증 가정(leap-of-faith): A URL-only evidence entry form with server-side metadata extraction (title, domain, timestamp) is the minimum useful capability for an NCII victim preparing a KCSC submission, before automated detection is added.
- 범위 밖 (이번 cycle 안 만듦):
  - D1-scaffold (already met — shipped BC-60)
  - D2-case-input (already met — shipped BC-73)
  - {'D4-content-shielded (already met — shipped BC-75, product_verdict': 'pass)'}
  - {'D5-export-csv (already met — shipped BC-76, final_verdict': 'achieved)'}
  - {'D6-source-adapter (already met — shipped BC-77, product_verdict': 'pass)'}
  - {'D7-text-search-brave (already met — shipped BC-78, product_verdict': 'pass)'}
  - {'D8-candidate-triage (already met — shipped BC-79, product_verdict': 'pass 2026-06-26)'}
  - Reverse-image detection and multi-source fan-out (Google Cloud Vision WEB_DETECTION, SerpAPI, TinEye)
  - Automated submission of takedown / KCSC (방심위) review / injunction filings
  - Storing, hosting, or re-distributing the content itself
  - Perpetrator identification or tracking
  - Page screenshot capture (Vercel headless-browser constraints)
  - Authentication / access control / multi-user (security objective prerequisite)
- ⚠️ 외부 노출 금지(NDA): identifying terms and detected URLs are victim data — do not log or surface in error messages

## 해야할 일

**파트 1 — 공유 데이터 계약 (Prisma 스키마 + 타입)** *(A-1)*

`prisma/schema.prisma`에 `Evidence` 모델을 추가한다: 필드는 `id`, `url`, `detectedAt DateTime`, `pageTitle String?`, `domain String`, `caseId String`, 그리고 `Case` 모델로의 관계(`caseId`를 외래 키로). `Case` 모델이 아직 없으면 최소 필드(`id`, `createdAt`)만으로 함께 정의한다. `npx prisma migrate dev` 또는 `prisma db push`로 마이그레이션한다. 이 스키마가 이후 모든 파트의 단일 진실 공급원이 된다.

**파트 2 — URL 제출 서버 라우트** *(A-1)*

`src/app/api/evidence/route.ts` (Next.js App Router)를 생성한다. `POST` 핸들러는 요청 바디에서 `{ url: string, caseId: string }`를 받아 다음을 수행한다:

1. Node.js 내장 `fetch`로 해당 URL을 `GET` 요청 — 응답 바디를 스트리밍하지 않고 텍스트로만 받는다.
2. 정규식(`/<title[^>]*>([^<]*)<\/title>/i`)으로 `<title>` 텍스트를 추출한다 — 외부 HTML 파서 없이 stdlib 수준으로 처리.
3. `new URL(url).hostname`으로 도메인을 추출한다.
4. `detectedAt: new Date()`를 스탬프하여 Prisma `Evidence` 행을 생성한다.
5. 생성된 행을 JSON으로 반환한다.

응답 바디를 완전히 버퍼링하거나 스트리밍 저장하지 않으며, 원본 콘텐츠(이미지·영상 URL 등)를 DB에 일절 기록하지 않는다.

**파트 3 — 증거 목록 UI 및 CSV 내보내기** *(A-1)*

`src/app/cases/[caseId]/evidence/page.tsx`를 생성한다. 서버 컴포넌트로, Prisma로 해당 `caseId`의 `Evidence` 목록을 조회해 렌더링한다. 목록 항목은 `url`(텍스트 또는 `<a>` 링크), `pageTitle`, `domain`, `detectedAt`만 표시한다 — `<img>` / `<video>` / `<iframe>` 요소는 일절 사용하지 않는다. CSV 내보내기는 `src/app/api/evidence/export/route.ts`에 `GET` 핸들러로 구현한다: Prisma로 조회 후 `url,pageTitle,domain,detectedAt` 헤더의 CSV 문자열을 직접 생성(`Content-Type: text/csv`)하여 반환한다 — 외부 CSV 라이브러리 없이 템플릿 문자열로 처리.

**파트 4 — 정적 분석 제약 검증** *(A-1 구조적 제약)*

목표에 명시된 "외부 의존성 없이 표준 라이브러리(+ Prisma/Next.js 기본 스택) 수준으로 처리" 제약을 기계적으로 검증한다. `scripts/check-imports.ts` (또는 `.mjs`)를 작성하여 파트 2·3에서 생성한 소스 파일들을 AST(`ts-morph` 없이 `fs` + 정규식, 또는 `tsc` API 없이 텍스트 파싱)로 검사하고, `import`된 모듈 중 허용 목록(`next`, `react`, `@prisma/client`, Node 내장 모듈) 외의 외부 패키지가 있으면 비정상 종료(exit 1)한다. 코딩 플래너가 이 스크립트를 오라클로 사용한다. 또한 `next build && tsc --noEmit`이 오류 없이 통과하는 것을 별도 CI 단계로 명시한다.

---

*범위 외(이번 슬라이스 불필요):* 피해자 인증/계정 관리, 자동 크롤러/스케줄러, KCSC 직접 API 연동, 이미지 지문 비교, 알림 기능 — 모두 이후 슬라이스로 이연.

## 수용기준 힌트 (성공의 모습)

frontmatter `acceptance` 와 1:1. evaluator 가 게이트에서 판단형 기준(P1)으로 도출.

- A-1: Adding a URL to a case creates a Prisma Evidence row {url, detectedAt, pageTitle, domain, caseId}; a server route fetches the page to extract <title> + domain and stamps detectedAt; the evidence list renders URL + metadata only (no <img>/<video> pointing at the detected URL). next build + tsc --noEmit pass.

- PKG-HEALTH: clean env 에서 프로젝트 표준 빌드+테스트 명령이 우회 없이 통과하고 패키지가 정상 빌드·실행된다 (python: `make test` 또는 `uv run pytest` — PYTHONPATH 우회 금지; node: package.json `packageManager` 기준 PM 으로 lockfile clean install+build+test, 예 `pnpm i --frozen-lockfile && pnpm build && pnpm test` 또는 `npm ci && npm run build && npm test`). 패키지명·레이아웃이 제품과 정합한다 — pyproject `name`·`packages`(python) 또는 package.json `name`(node)이 제품명이고, 템플릿 잔재(`python-service-template`·`src/app` 패키지·`nextjs-service-template` 등)가 남지 않는다.

## 코딩 가이드 (planner)

**분해 (큰 작업도 atomic task DAG 로):**
- acceptance 1개 ≈ atomic task 1개. 한 task = 한 변경 단위(파일-수준 allowed_paths, ≤12 파일·≤6 디렉토리). 넘으면 더 쪼갠다.
- **인터페이스-first**: 여러 부분이 한 계약(함수 시그니처/타입/API 스키마)을 공유하면, 계약+그 계약 테스트를 먼저 task-0 으로 두고 나머지 task 가 `depends_on` 으로 연결(병렬 가능).
- **예외처리는 별도 task 가 아니라 그 기능 task 안에** (구현+엣지케이스+테스트 = 한 atomic 단위).
- `depends_on` 은 정말 선행 산출물이 필요할 때만. 독립이면 평면(병렬)로.
- 한 goal 이 너무 크면(평면 분해 불가) thin/insufficient 반환 — goal 을 더 작은 1-PR 단위로 쪼개는 건 allocator/상위 책임.

**검증 기준(oracle = task 완료를 자동 판정하는 테스트):**
- 각 task 는 결정적 검증 커맨드를 갖는다 — 구현 전 red, 구현 후 green (negative-control 성립).
- **테스트 파일은 allowed_paths 에 넣지 않는다** (오라클 훼손 방지; context_hints 로만 참조).
- 정적 분석으로 표현 가능한 제약(의존성·import 구조·타입·스키마)은 테스트(예 `python -m pytest`, ast 검사)로 검증 채널을 만든다 — 산문 주장만 두면 평가서 '증거 없음'으로 미성취.
- 도메인별 oracle 예시: 순수 로직→단위 pytest; 웹 API→핸들러 단위·스키마·통합(testcontainer); 프론트→컴포넌트·스냅샷. 자동 검증 불가한 주관/런타임 품질만 사람·heavy 증거로(분리).

**패키징·레이아웃 (PKG-HEALTH — 템플릿 잔재 금지, stack 별):**
- **python**: 코드 `src/<product>/`, pyproject `name`·`[tool.hatch...]packages`·`pythonpath` 가 그 패키지와 정합. 템플릿 잔재(`src/app`·`python-service-template`) 잔존 금지.
- **node(nextjs/astro)**: package.json `name`=제품명. 코드는 템플릿 규약(`src/app`·`src/components` 등 Next.js 구조) 유지. `nextjs-service-template` 등 잔존 금지.
- 빌드/테스트 검증은 **프로젝트 표준 명령**(python `make test`; node = package.json `packageManager` 기준 PM, 예 `pnpm i --frozen-lockfile && pnpm build && pnpm test`)으로 — clean env(설치·빌드) 기준. ad-hoc 우회(`PYTHONPATH=.` 등)로 통과시키면 PKG-HEALTH 미충족(돌아가는 척 = false-complete).

**PKG-HEALTH 는 task 로 만들지 말 것 (SCR-520 — 엔진이 강제):**
- PKG-HEALTH 에 대한 **코더 task 를 만들지 않는다**. 엔진이 모든 task terminal + goal COMPLETED 후 통합 트리에서 clean build+test 를 1회 돌려 강제한다(통과해야 PR 제출, 실패면 미성취). 코더 task 로 두면 통합 앱이 이미 깨끗할 때 바꿀 게 없어 'no changes' 로 역설적 실패한다.
- **각 기능 task 는 그 자체로 lint·build clean**: unused var/import(예 빈 `catch (e)`) 금지 — node `next build` 는 전체 프로젝트에 ESLint 를 돌려 한 task 의 잔재가 통합 build 전체를 red 로 만든다(per-task 단위테스트는 통과해도). 통합 build 가 red 면 엔진 PKG-HEALTH 게이트가 미성취 처리.
