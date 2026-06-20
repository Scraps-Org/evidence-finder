#!/usr/bin/env bash
# PR-only 가드 — 보호 브랜치 직접 push 차단 + 브랜치명 규칙 강제.
# HANDOUT §8.4 · ADR-003: 제품 레포 gitflow 4축(master/prod/dev/work) + 본 레포 master 단일 예외.
# 승급 work →PR→ dev →PR→ prod →PR→ master. work 는 자유 작업 축(직접 push OK),
# dev/prod/master 는 보호. pre-commit framework 의 pre-push stage + raw .git/hooks/pre-push 로 동작.
#
# 동작:
#   1) push 대상(remote) ref 가 보호 브랜치(master/main/prod/dev)면 거부 (stdin 의 push line 검사)
#   2) 현재 브랜치가 보호 브랜치면 거부 (방어 — stdin 비었을 때 fallback)
#   3) 현재 브랜치명이 규칙(<type>/<설명> 또는 work)을 어기면 거부
#
# 탈출구: ALLOW_PROTECTED_PUSH=1  (부트스트랩 초기 scaffold·4축 backfill push 1회용)
#   예) ALLOW_PROTECTED_PUSH=1 git push -u origin master
#       ALLOW_PROTECTED_PUSH=1 git push origin prod dev work   # 4축 초기화
#
# 진짜 무조건 강제(branch protection)는 무료 plan 에서 API 403 → 불가.
# org Team 업글 / repo public 시 scripts/apply-branch-protection.sh 로 승격.
set -euo pipefail

PROTECTED_RE='^(master|main|prod|dev)$'
# 허용 브랜치명: github-guide.md §브랜치 타입 topic(<type>/<설명>) + gitflow work 축(ADR-003).
# work 는 4축의 자유 작업 축이라 단독 브랜치명으로 허용한다.
NAMING_RE='^(feat|fix|refactor|chore|docs|style|test|perf|ci)/.+|^work$'

if [[ "${ALLOW_PROTECTED_PUSH:-0}" == "1" ]]; then
  echo "↩︎ ALLOW_PROTECTED_PUSH=1 — PR-only 가드 우회 (부트스트랩 경로)." >&2
  exit 0
fi

fail() {
  echo "" >&2
  echo "✋ PR-only 가드 거부: $1" >&2
  echo "   → 승급 흐름: work →PR→ dev →PR→ prod →PR→ master (gitflow 4축, HANDOUT §8.4 · ADR-003)." >&2
  echo "   → work(자유 작업 축)에서 작업 후 PR 로 상위 축에 머지하세요. dev/prod/master 직접 push 금지." >&2
  echo "   → 부트스트랩 초기·4축 backfill push 면: ALLOW_PROTECTED_PUSH=1 git push ..." >&2
  echo "" >&2
  exit 1
}

# 1) push 대상 ref 검사 — pre-push stdin: "<local ref> <local sha> <remote ref> <remote sha>"
#    (pre-commit framework·raw hook 모두 동일 포맷을 stdin 으로 전달)
while read -r _local_ref _local_sha remote_ref _remote_sha; do
  [[ -z "${remote_ref:-}" ]] && continue
  dest="${remote_ref#refs/heads/}"
  if [[ "$dest" =~ $PROTECTED_RE ]]; then
    fail "보호 브랜치 '$dest' 로 직접 push 시도"
  fi
done

# 2) 현재 브랜치 검사 (stdin 이 비었거나 detached 가 아닐 때의 방어선)
current="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if [[ "$current" =~ $PROTECTED_RE ]]; then
  fail "보호 브랜치 '$current' 위에서 push 시도"
fi

# 3) topic 브랜치명 규칙
if [[ -n "$current" && "$current" != "HEAD" && ! "$current" =~ $NAMING_RE ]]; then
  fail "브랜치명 '$current' 규칙 위반 — <type>/<설명> (feat|fix|refactor|chore|docs|style|test|perf|ci)"
fi

exit 0
