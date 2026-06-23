---
product: evidence-finder
dimension_id: D2-case-input
status: active
owner: whitemoons
requested_by: whitemoons
objective: >
  Let a victim using the NCII evidence-finder enter their identifying terms
  (name/identifier) and persist them as a Case on Vercel Postgres via Prisma,
  then see the saved case in a case list. This is the case-input slice of the
  manual evidence spine: URL/metadata-centric, no distributed content stored.
acceptance:
  - id: A-1
    high_impact: true
    hint: >
      The case-creation form accepts identifying terms and, on submit, a Next.js
      API route inserts a row into a Prisma `Case` model with an `identifyingTerms`
      text column on Vercel Postgres; a single migration under prisma/migrations/
      creates the Case table. The persistence is real against the database (do not
      mock the DB boundary being verified).
  - id: A-2
    hint: >
      The newly saved case is read back from Postgres and appears in the case list,
      showing the stored identifyingTerms value.
  - id: A-3
    hint: >
      Empty or whitespace-only identifying-term input is rejected and writes no row.
  - id: A-4
    hint: >
      next build and tsc --noEmit both pass (PKG-HEALTH gate).
constraints:
  persistence: >
    Vercel Postgres via Prisma; the database stores only identifying terms (no
    distributed content).
  health: Next.js build and tsc --noEmit must pass.
---

# D2 — case input (manual re-run, 2026-06-23)

One-off reseed to re-run the continuously-failing D2 dimension under ADR-041
verdict-driven escalation (rework → judge-tier oracle strengthening + staged
coder ladder). Authored from `products/evidence-finder/objective.yaml`
`D2-case-input`. The lean cycle owns this handoff file normally; this is a
deliberate re-trigger for the strengthening test and will be superseded by the
next lean cycle.
