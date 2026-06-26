---
# 기계 goal contract (allocator goal_input.py primary 파싱 — Notion SCRAPS-GOAL fallback)
product: evidence-finder
owner: whitemoons
goal_version: rev5
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
  legal action (KCSC filing, injunctions, takedown requests). The manual
  evidence spine requires D3 (manual URL add → Evidence row + metadata fetch)
  as its core gateway — D4/D5/D6/D7/D8 shipped atop D3's presumed Evidence
  model foundation, making this a fast-verification dispatch. BC-74
  dispatched as inconclusive; D8-candidate-triage (BC-79, pass, shipped
  2026-06-26) confirmed the Candidate→Evidence routing works, which depends on
  the same Evidence model D3 must establish end-to-end.
scope_out:
  - D1-scaffold (already met — shipped BC-60)
  - D2-case-input (already met — shipped BC-73)
  - D4-content-shielded (already met — shipped BC-75, product_verdict: pass)
  - D5-export-csv (already met — shipped BC-76, final_verdict: achieved)
  - D6-source-adapter (already met — shipped BC-77, product_verdict: pass)
  - D7-text-search-brave (already met — shipped BC-78, product_verdict: pass)
  - D8-candidate-triage (already met — shipped BC-79, product_verdict: pass 2026-06-26)
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
Last updated: 2026-06-26 (lean-startup `/lean-strategy-push` rev 5)
Source: scraps Notion lean-validation (Build Cycles) + `products/evidence-finder/objective.yaml`

> frontmatter = allocator 기계 입력(tight). 아래 본문 = 사람·coder 열람용(서사+진행). allocator는 frontmatter만 소비.

⚠️ No HYP rows in the lean Hypotheses DB for this product — objective sourced from founder intake + NCII URL-detection feasibility research (objective.yaml, SCR-611). GTM/stage/engine omitted (no `_projects_child_rows` entry in lean-os.json; register via `/lean-projects-sync --register evidence-finder`).

## 검증 중인 가설
lean Notion DB의 HYP row 없음 — objective.yaml의 validated bet(공동창업자 intake + NCII URL 탐지 feasibility research)를 바탕으로 D8(candidate triage)까지 Validated Learning 누적. 

## 현재 목표
- **dimension**: D3-manual-evidence — 수동으로 URL 추가 → Prisma Evidence row + 메타데이터 fetch(title, domain, detectedAt)
- **acceptance signal**: Prisma `Evidence` row 생성 + 서버 라우트 페이지 fetch → URL+메타데이터만 렌더(img/video auto-load 없음) + next build/tsc pass
- **remaining dimensions (pending)**: D3-manual-evidence · D9-recall-and-referral
- **met (shipped by gateway)**: D1 · D2 · D4 · D5 · D6 · D7 · D8 (7/9 complete)

## 빌드 진행 (build cycles)
- BC-79 · D8-candidate-triage · shipped — product_verdict: **pass** ✅ (2026-06-26 · triage server action + Candidate 상태 persist + evidence 라우팅; shipped+achieved)
- BC-78 · D7-text-search-brave · shipped — product_verdict: **pass** ✅ (BraveSource implements SearchSource via Brave API; Candidate table upsert+dedup; ≥1 normalized result; build+tsc pass)
- BC-77 · D6-source-adapter · shipped — product_verdict: **pass** ✅ (typed SearchSource interface + fixture + unit test + no network call + build/tsc pass)
- BC-76 · D5-export-csv · shipped — final_verdict: achieved ✅ (CSV export per evidence row: url, detectedAt, pageTitle, domain)
- BC-75 · D4-content-shielded · shipped — product_verdict: **pass** ✅ (기본 렌더 미디어 자동로드 없음 + 명시적 "확인" 컨트롤 + build+tsc pass)
- BC-74 · D3-manual-evidence · dispatched — product_verdict: inconclusive (증거 미비 — PR 미dispatch; re-dispatch 대기)
- BC-73 · D2-case-input · shipped — final_verdict: achieved ✅ (식별 텀 저장·DB row·마이그레이션)
- BC-60 · D1-scaffold · shipped — final_verdict: achieved ✅ (evidence-finder 리네임 + 랜딩)

## 최근 진행·열린 액션
lean-os.json Projects DB row 없음 — `/lean-projects-sync --register evidence-finder` 등록 후 LEAN-ACTIONS·LEAN-PROGRESS 롤업.

## 접근 방향
- **다음 우선순위 dimension**: D3-manual-evidence (가장 상단 pending — D4/D5/D6/D7/D8 모두 D3 Evidence 모델 위에서 동작, gateway dispatch 재시도)
- **추천 MVP 패턴**: Concierge MVP — D3 gateway(Evidence row + 메타데이터 fetch)를 수동 검증 후 D8(candidate triage: confirmed→evidence)까지 연결하면 완전한 수동 증거 spine이 닫힌다(Ries Ch.6 Concierge).
- **피해야 할 anti-pattern**: D3 gateway를 미검증인 채로 D8(candidate triage) merge만 met으로 처리 — D3의 Evidence model이 실제 gateway에서 end-to-end 검증돼야 D4·D8 merge가 온전히 met (SCR-609/610: 미머지 브랜치는 met 아님).

## 최근 인사이트 (30d)
lean Notion DB의 [결과] 인터뷰 row 없음 (NCII 피해자 인터뷰는 민감도·접근 제약으로 별도 경로).

## 의사결정 로그
관련 D-NNN Decisions DB row 없음.

## 최근 회의
관련 Meetings DB row 없음.

## Cross-link
- Build Cycles (Notion):
  - BC-79 · D8 · shipped · pass: https://app.notion.com/p/eval-evidence-finder-be43169ce0ed-38bff5099be281cea8aaf1952b66aa2b
  - BC-78 · D7 · shipped · pass: https://app.notion.com/p/eval-evidence-finder-fe038c18fcbd-38aff5099be2819caebfecb5857633e4
  - BC-77 · D6 · shipped · pass: https://app.notion.com/p/eval-evidence-finder-5922377dac34-38aff5099be281d09319e9f75406ff86
  - BC-76 · D5 · shipped: https://app.notion.com/p/eval-evidence-finder-5df61a4bda2a-38aff5099be281bdb5c0c7f806d71fac
  - BC-75 · D4 · shipped · pass: https://app.notion.com/p/eval-evidence-finder-2bc3a53e4e30-38aff5099be281678306e69f8adb5d52
  - BC-74 · D3 · dispatched · inconclusive: https://app.notion.com/p/eval-evidence-finder-d1077e00928e-388ff5099be28132a764d7f8e72a8e55
  - BC-73 · D2 · shipped: https://app.notion.com/p/eval-evidence-finder-e066e29c2db9-388ff5099be281939e61fddd7538ada8
- objective.yaml: `products/evidence-finder/objective.yaml` (lean repo SoT — immutable roadmap)

---
<!-- LEAN-STRATEGY-META rev=5 lean_startup_commit=lean-os-2026-06-26 generated_at=2026-06-26T00:00:00Z source_pages=8 -->
