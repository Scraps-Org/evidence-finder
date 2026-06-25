---
# 기계 goal contract (allocator goal_input.py primary 파싱 — Notion SCRAPS-GOAL fallback)
product: evidence-finder
owner: whitemoons
goal_version: rev2
status: active
dimension_id: D3-manual-evidence
objective: >
  A web service for NCII (non-consensual intimate image) victims to locate
  URLs of posts exposing them and compile each into a report-ready evidence
  package — URL, detection timestamp, page title/domain — exportable as CSV
  for KCSC (방심위) review, takedown requests, and injunctions. URL/metadata-
  centric: the distributed content itself is never stored and never shown by
  default. Detection = best-effort surfacer of publicly-indexed exposure
  feeding a human-triage workflow.
acceptance:
  - id: A-1
    hint: >
      Adding a URL to a case creates a Prisma Evidence row
      {url, detectedAt, pageTitle, domain, caseId}; a server route fetches
      the page to extract <title> + domain and stamps detectedAt; the evidence
      list renders URL + metadata only (no <img>/<video> pointing at the
      detected URL). next build + tsc --noEmit pass.
    high_impact: false
background: >
  NCII victims currently have no systematic tool to document exposure URLs for
  legal action (KCSC filing, injunctions, takedown requests). D1 (app scaffold),
  D2 (case creation with identifying terms), and D4 (content shielded by default)
  are shipped. D3 adds the core evidence-entry capability — manually adding a URL
  and organizing it into a reportable evidence item while ensuring the distributed
  media is never auto-shown.
scope_out:
  - D1-scaffold (already met — shipped BC-60)
  - D2-case-input (already met — shipped BC-73)
  - D4-content-shielded (already met — shipped BC-75, product_verdict: pass 2026-06-25)
  - Reverse-image detection and multi-source fan-out (Google Cloud Vision WEB_DETECTION, SerpAPI, TinEye)
  - Automated submission of takedown / KCSC (방심위) review / injunction filings
  - Storing, hosting, or re-distributing the content itself
  - Perpetrator identification or tracking
  - Page screenshot capture (Vercel headless-browser constraints)
  - Authentication / access control / multi-user (security objective prerequisite)
assumption: >
  A URL-only evidence entry form with server-side metadata extraction
  (title, domain, timestamp) is the minimum useful capability for an NCII
  victim preparing a KCSC submission, before automated detection is added.
constraints:
  nda: false
  data_sensitivity: PII
  redaction_note: "identifying terms and detected URLs are victim data — do not log or surface in error messages"
metric_contract:
  - { acceptance_id: A-1, metric: "next build exit code", target: 0, baseline: unknown, unit: count }
  - { acceptance_id: A-1, metric: "tsc --noEmit exit code", target: 0, baseline: unknown, unit: count }
---

# Lean Strategy — evidence-finder
Last updated: 2026-06-25 (lean-startup `/lean-strategy-push` rev 2)
Source: scraps Notion lean-validation (Build Cycles) + `products/evidence-finder/objective.yaml`

> frontmatter = allocator 기계 입력(tight). 아래 본문 = 사람·coder 열람용(서사+진행). allocator는 frontmatter만 소비.

⚠️ No HYP rows in the lean Hypotheses DB for this product — objective sourced from founder intake + NCII URL-detection feasibility research (objective.yaml, SCR-611). GTM/stage/engine omitted (no `_projects_child_rows` entry in lean-os.json; register via `/lean-projects-sync --register evidence-finder`).

## 검증 중인 가설
lean Notion DB에 HYP row 없음 — objective.yaml에서 validated bet(설립자 intake + NCII URL 탐지 feasibility research pass) 기반으로 D5(CSV export) 이후 Validated Learning 확보 예정.

## 현재 목표
- **dimension**: D3-manual-evidence — 사용자가 URL 수동 입력 → Prisma Evidence row + 서버사이드 메타데이터 추출(title, domain, detectedAt)
- **acceptance signal**: Prisma `Evidence` row 생성 + 서버 라우트 페이지 fetch → 증거 목록 URL+메타데이터만 렌더(img/video auto-load 없음) + next build/tsc pass
- **remaining dimensions (pending)**: D3-manual-evidence · D5-export-csv · D6-source-adapter · D7-text-search-brave · D8-candidate-triage · D9-recall-and-referral

## 빌드 진행 (build cycles)
- BC-75 · D4-content-shielded · shipped — product_verdict: **pass** ✅ (2026-06-25 — 기본 렌더 미디어 숨김 + 명시적 "확인" 컨트롤 + build+tsc pass)
- BC-74 · D3-manual-evidence · dispatched — product_verdict: inconclusive (진행 중 — PR 미머지)
- BC-73 · D2-case-input · shipped — final_verdict: achieved ✅ (식별 텍스트·DB 마이그레이션)
- BC-60 · D1-scaffold · shipped — final_verdict: achieved ✅ (evidence-finder 앱 리네임 + 랜딩)

## 최근 진행·열린 액션
lean-os.json Projects DB row 미등록 — `/lean-projects-sync --register evidence-finder`로 등록 후 LEAN-ACTIONS·LEAN-PROGRESS 활성화.

## 접근 방향
- **다음 우선순위 dimension**: D3-manual-evidence (파일 순서 기준 최선두 pending — D4가 D3 앞서 shipped됐으나 D3 미완)
- **추천 MVP 패턴**: Concierge MVP — URL 수동 입력 흐름을 먼저 완성(D3~D5)한 뒤 자동탐지(D6~D9)로 확장. 수동 evidence spine이 실제 KCSC 제출에 쓸모 있는지 먼저 확인(Ries Ch.6 Concierge).
- **피해야 할 anti-pattern**: D6~D9(자동탐지) 먼저 빌드 — objective.yaml shape("D1~D5 = complete shippable MANUAL evidence spine") 참조. 수동 core ship 전 탐지 기능 투자는 scope drift.

## 최근 인사이트 (30d)
lean Notion DB에 [결과] 인터뷰 페이지 없음 — D5(CSV export) 출시 후 pilot 사용자에게서 Validated Learning 확보 예정.

## 의사결정 로그
관련 D-NNN Decisions DB 없음.

## 최근 회의
관련 Meetings DB row 없음.

## Cross-link
- Build Cycles (Notion):
  - BC-75 · D4 · shipped: https://app.notion.com/p/eval-evidence-finder-2bc3a53e4e30-38aff5099be281678306e69f8adb5d52
  - BC-74 · D3 · dispatched: https://app.notion.com/p/eval-evidence-finder-d1077e00928e-388ff5099be28132a764d7f8e72a8e55
  - BC-73 · D2 · shipped: https://app.notion.com/p/eval-evidence-finder-e066e29c2db9-388ff5099be281939e61fddd7538ada8
  - BC-60 · D1 · shipped: https://app.notion.com/p/eval-evidence-finder-a5b6ec5df1d8-385ff5099be281e5ab9ad91ec41acc60
- objective.yaml: `products/evidence-finder/objective.yaml` (lean repo SoT — immutable roadmap)

---
<!-- LEAN-STRATEGY-META rev=2 lean_startup_commit=lean-os-2026-06-25 generated_at=2026-06-25T00:00:00Z source_pages=4 -->
