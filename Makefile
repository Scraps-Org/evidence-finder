.DEFAULT_GOAL := help
.PHONY: help install dev run build start lint format typecheck test cov clean \
        docker-build docker-run up down logs

# ─────────────────────────────────────────────────────────────
# Local (pnpm)
# ─────────────────────────────────────────────────────────────

help:  ## 사용 가능한 명령어 목록
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install:  ## 의존성 설치 (pnpm install)
	pnpm install

dev: install  ## 개발 셋업 (pnpm install + pre-commit + next dev)
	pnpm exec pre-commit install || true
	pnpm dev

run:  ## next dev (포트 3000)
	pnpm dev

build:  ## next build → .next/standalone
	pnpm build

start:  ## 빌드 결과 production 모드 실행
	pnpm start

lint:  ## eslint + prettier --check
	pnpm lint

format:  ## prettier --write + eslint --fix
	pnpm format

typecheck:  ## tsc --noEmit
	pnpm typecheck

test:  ## vitest 실행
	pnpm test

cov:  ## vitest --coverage HTML
	pnpm run test:coverage
	@echo "리포트: coverage/index.html"

clean:  ## 캐시 / 빌드 산출물 제거
	rm -rf .next coverage node_modules/.cache

# ─────────────────────────────────────────────────────────────
# Docker
# ─────────────────────────────────────────────────────────────

docker-build:  ## 도커 이미지 빌드
	docker build -t nextjs-service-template:latest .

docker-run:  ## 도커 컨테이너 단발 실행 (포트 3000)
	docker run --rm -it -p 3000:3000 nextjs-service-template:latest

up:  ## docker compose 기동 (백그라운드)
	docker compose up -d --build

down:  ## docker compose 중지 + 정리
	docker compose down

logs:  ## docker compose 로그 스트림
	docker compose logs -f
