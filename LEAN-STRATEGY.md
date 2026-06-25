---
# 기계 goal contract (allocator goal_input.py primary 파싱 — Notion SCRAPS-GOAL fallback)
product: evidence-finder
owner: whitemoons
goal_version: rev1
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
  legal action (KCSC filing, injunctions, takedown requests). D1 (app scaffold)
  and D2 (case creation with identifying terms) are shipped. D3 adds the core
  evidence-entry capability — manually adding a URL and organizing it into a
  reportable evidence item while ensuring the distributed media is never
  auto-shown.
scope_out:
  - D1-scaffold (already met — shipped BC-60)
  - D2-case-input (already met — shipped BC-73)
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
Last updated: 2026-06-25 (lean-startup `/lean-strategy-push` rev 1)
Source: scraps Notion lean-validation (Build Cycles) + `products/evidence-finder/objective.yaml`

> frontmatter = allocator 기계 입력(tight). 아래 본문 = 사람·coder 열람용(서사+진행). allocator는 frontmatter만 소비.

⚠️ No HYP rows in the lean Hypotheses DB for this product — objective sourced from founder intake + NCII URL-detection feasibility research (objective.yaml, SCR-611). GTM/stage/engine omitted (no _projects_child_rows entry in lean-os.json; register via `/lean-projects-sync --register evidence-finder`).

## 검증 중인 가설
lean Notion DB에 등록된 HYP 없음 — objective.yaml의 validated bet(창업자 인테이크 + NCII URL 탐지 feasibility 연구 pass) 기반 빌드. 정식 HYP 등록 및 인터뷰 검증은 D5(CSV export) 이후 첫 실사용자 피드백 시 권장.

## 현재 목표
- **dimension**: D3-manual-evidence — 사용자가 URL을 수동 입력해 증거 항목으로 정리 (미디어 미표시)
- **acceptance signal**: Prisma `Evidence` row 생성 + 서버 사이드 메타데이터 추출(title, domain, detectedAt) + 증거 목록 URL+메타만 렌더(img/video auto-load 없음) + next build/tsc pass
- **remaining dimensions (pending)**: D3-manual-evidence · D4-content-shielded · D5-export-csv · D6-source-adapter · D7-text-search-brave · D8-candidate-triage · D9-recall-and-referral

## 빌드 진행 (build cycles)
- BC-60 · D1-scaffold · shipped — final_verdict: achieved ✅ (앱 이름·랜딩 페이지)
- BC-73 · D2-case-input · shipped — final_verdict: achieved ✅ (케이스 생성·identifying terms·DB migration)
- BC-74 · D3-manual-evidence · dispatched — product_verdict: inconclusive (진행 중 — PR 미확인)

## 최근 진행·열린 액션
lean-os.json에 Projects DB row 미등록 — `/lean-projects-sync --register evidence-finder` 권장 (LEAN-ACTIONS·LEAN-PROGRESS 활성화됨).

## 접근 방향
- **다음 우선순위 차원**: D3-manual-evidence (URL 수동 입력 → Prisma Evidence row + 서버 메타추출)
- **추천 MVP 패턴**: Concierge MVP 적용 — 한 명의 실제 피해자가 URL 입력 → 메타 자동수집 → CSV 내보내기의 선형 플로우를 수동 코어(D3~D5)로 완성한 뒤, 자동화 탐지(D6~D9)를 추가하는 순서. (Ries Ch.6 Concierge)
- **피해야 할 anti-pattern**: D6~D9(자동 탐지) 먼저 구축 — D3~D5(수동 증거 spine)가 없으면 탐지 결과를 담을 컨테이너가 없음. objective.yaml의 shape 원칙("D1–D5 = complete shippable MANUAL evidence spine") 준수.

## 최근 인사이트 (30d)
인터뷰 [결과] 없음 — NCII 피해자 대상 정식 인터뷰 미진행. D5(CSV export) 후 실사용자 pilot 시 첫 Validated Learning 기회.

## 의사결정 로그
관련 D-NNN Decisions DB 항목 없음.

## 최근 회의
관련 Meetings DB 항목 없음.

## Cross-link
- Build Cycles (Notion):
  - BC-74 · D3 · dispatched: https://app.notion.com/p/eval-evidence-finder-d1077e00928e-388ff5099be28132a764d7f8e72a8e55
  - BC-73 · D2 · shipped: https://app.notion.com/p/eval-evidence-finder-e066e29c2db9-388ff5099be281939e61fddd7538ada8
  - BC-60 · D1 · shipped: https://app.notion.com/p/eval-evidence-finder-a5b6ec5df1d8-385ff5099be281e5ab9ad91ec41acc60
- objective.yaml: `products/evidence-finder/objective.yaml` (lean repo SoT — immutable roadmap)

---
<!-- LEAN-STRATEGY-META rev=1 lean_startup_commit=lean-os-2026-06-25 generated_at=2026-06-25T00:00:00Z source_pages=3 -->
