#!/usr/bin/env bash
# 컨테이너 생성 직후 1회 실행되는 셋업 스크립트
set -euo pipefail

echo "🔧 [1/4] corepack 활성화 + pnpm 설치..."
corepack enable
corepack prepare pnpm@latest --activate

echo "📦 [2/4] pnpm 의존성 설치..."
if [ -f "package.json" ]; then
  pnpm install --frozen-lockfile || pnpm install
else
  echo "  package.json 이 없어 건너뜁니다."
fi

echo "🔒 [3/4] pre-commit 훅 등록..."
if [ -f ".pre-commit-config.yaml" ]; then
  pip install --user pre-commit || pipx install pre-commit || true

  git config --global --add safe.directory "$(pwd)" || true

  if git rev-parse --git-dir > /dev/null 2>&1; then
    pre-commit install
    pre-commit install --hook-type commit-msg
    pre-commit install --hook-type pre-push
  else
    echo "  git 저장소가 아니라 pre-commit 훅 등록을 건너뜁니다."
  fi
else
  echo "  .pre-commit-config.yaml 이 없어 건너뜁니다."
fi

echo "📝 [4/4] .env 파일 초기화..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "  .env 파일이 생성되었습니다."
fi

echo ""
echo "✅ 셋업 완료!"
echo "   다음 명령으로 시작하세요: make dev"
