# Atalhos na raiz do repo. Uso: make help
.DEFAULT_GOAL := help

BASE_URL ?= http://localhost:5173
BASE_URL_PROD_LOCAL ?= http://localhost:8787

COMPOSE_DEV := docker compose $(if $(wildcard .docker/.env),--env-file .docker/.env,) -f .docker/docker-compose.dev.yaml
COMPOSE_PROD := docker compose -f compose.prod.yaml

.PHONY: help install dev test test-coverage lint build deploy \
	k6 k6-prod health health-prod env-example api-token \
	docker-dev docker-prod docker-dev-down docker-prod-down

help: ## Lista alvos disponíveis
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## npm install
	npm install

dev: ## Vite (porta 5173) — API local se .docker/.env estiver preenchido
	npm run dev

test: ## Vitest (rápido, sem coverage)
	npm test

test-bank-isolation: ## Integração RLS no Postgres (compose com db no ar; opt-in)
	RUN_BANK_ISOLATION=1 npm test -- src/server/bank-isolation.integration.spec.ts

test-coverage: ## Vitest + coverage (mesmo gate do CI)
	npm run test:coverage

lint: ## oxlint
	npm run lint

build: ## tsc + vite build
	npm run build

deploy: ## build + wrangler deploy
	npm run deploy

k6: ## Smoke p95 em GET /api/health (app em BASE_URL, padrão 5173)
	@if command -v k6 >/dev/null 2>&1; then \
		k6 run -e BASE_URL=$(BASE_URL) perf/health-smoke.js; \
	else \
		echo "k6 não encontrado — no Dev Container: Dev Containers → Rebuild Container (k6 está em .docker/Dockerfile.dev). No host com Docker: docker run --rm -i --network=host -v \"$(CURDIR)/perf:/perf:ro\" -e BASE_URL=$(BASE_URL) grafana/k6 run /perf/health-smoke.js"; \
		exit 127; \
	fi

k6-prod: ## Smoke no compose prod local (BASE_URL_PROD_LOCAL, padrão 8787)
	@if command -v k6 >/dev/null 2>&1; then \
		k6 run -e BASE_URL=$(BASE_URL_PROD_LOCAL) perf/health-smoke.js; \
	else \
		echo "k6 não encontrado — no Dev Container: Rebuild Container; no host: docker run com grafana/k6 (BASE_URL=$(BASE_URL_PROD_LOCAL))."; \
		exit 127; \
	fi

health: ## curl /api/health (BASE_URL)
	curl -sS "$(BASE_URL)/api/health"

health-prod: ## curl /api/health em 8787
	curl -sS "$(BASE_URL_PROD_LOCAL)/api/health"

API_LOGIN ?= teste
API_PASSWORD ?= teste

api-token: ## JWT para Swagger/curl (demo: teste/teste; override API_LOGIN, API_PASSWORD, BASE_URL)
	@BASE_URL="$(BASE_URL)" API_LOGIN="$(API_LOGIN)" API_PASSWORD="$(API_PASSWORD)" bash scripts/api-auth-token.sh

env-example: ## Cria .docker/.env a partir do exemplo se ainda não existir
	cp -n .docker/.env.example .docker/.env && echo "Criado .docker/.env — edite DATABASE_URL e JWT_SECRET." || echo ".docker/.env já existe."

docker-dev: ## Compose dev (Vite 5173, hot reload)
	$(COMPOSE_DEV) up --build

docker-prod: ## Compose prod local (Wrangler 8787)
	$(COMPOSE_PROD) up --build

docker-dev-down: ## Para containers dev
	$(COMPOSE_DEV) down

docker-prod-down: ## Para containers prod local
	$(COMPOSE_PROD) down

ci: lint test-coverage build ## Sequência parecida com o pipeline (sem deploy)
