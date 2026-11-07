# SPEC-09 Projeto B — o que falta

Status: pendente.

Fecha os entregáveis do Projeto B que o repositório ainda não tem. Não muda domínio, paleta, banco nem o contrato de `BankRepository`. O app continua sem movimentar dinheiro.

O que já vale e esta spec não refaz: testes unitários do domínio, CI com `npm ci`, lint e teste, `.docker/.env.example` com segredos fora do git, README de primeiro dia.

## Objetivo

Um implementador sobe o app com um comando, justifica o Repository, prova a API por um teste de integração, trava um piso de coverage no pipeline, registra log, métrica e SLO simples, deixa um ADR e publica o contrato de `GET /api/health` com um smoke k6 que mede p95.

## Regras

### 1. Compose com um comando

O banco continua o Neon remoto. O Compose não sobe Postgres.

- Criar `Dockerfile` na raiz: Node 22, `npm ci`, comando `npm run dev -- --host 0.0.0.0 --port 5173`.
- Criar `compose.yaml` na raiz com um serviço `app`. Publica `5173:5173`. Lê variáveis de `.docker/.env` (`env_file`). Não copia `.env` para a imagem e não grava segredo no repositório.
- O comando único é `docker compose up`. Com o env preenchido, `http://localhost:5173` responde e `/api/health` reflete `DATABASE_URL` e `JWT_SECRET`. Sem o arquivo, o container sobe e `/api/health` responde `configured: false`.

### 2. Texto que justifica o Repository

Acrescentar em `docs/arquitetura.md` um trecho curto (um parágrafo) que aponte para o ADR do item 6.

O texto diz: a interface fala com `BankRepository`; a implementação em memória serve testes; a HTTP fala com a API; o domínio não importa Neon nem React. A alternativa descartada é a tela abrir SQL direto.

Não alterar a interface em `src/repositories/bank-repository.ts`.

### 3. Um teste de integração da API

Não adicionar Express nem Supertest. O handler já é Fetch (`createApiHandler`).

- Criar `src/server/health.integration.spec.ts`.
- O teste sobe `node:http`, encaminha cada pedido a `createApiHandler` e chama com `fetch`.
- `GET /api/health` sem segredos: status 200 e JSON com `configured`, `database` e `jwt` booleanos, todos `false`.
- O mesmo teste, com `databaseUrl` e `jwtSecret` fictícios (32 caracteres ou mais), recebe os três `true` e não abre conexão com o Neon. `/api/health` não consulta o banco.
- Encerrar o servidor no fim do teste.

### 4. Coverage mínimo no pipeline

- Script `test:coverage` em `package.json`: `vitest run --coverage`.
- Em `vite.config.ts`, `test.coverage` com provider `v8` e `thresholds` de lines, statements, functions e branches.
- O piso é o que a suíte já atinge, arredondado para baixo. Na implementação, rodar `npm run test:coverage` uma vez e gravar esses quatro números. Não escolher 80% no chute.
- Nos workflows `.github/workflows/developer.yml` e `.github/workflows/deploy.yml`, o job de testes roda `npm run test:coverage` no lugar de `npm test`. Abaixo do piso, o job falha.
- `npm test` permanece para a volta local sem coverage.

### 5. Log estruturado, uma métrica, um SLO

Sem pino, prom-client, Prometheus ou Grafana. O processo também roda no Worker, e o contador em memória zera quando o isolate reinicia. Isso fica escrito no SLO.

- Criar `src/server/request-log.ts`. Cada resposta de `/api/*` emite uma linha JSON em `console.log`, com `time`, `level`, `method`, `path`, `status` e `durationMs`. Sem corpo, sem token, sem `DATABASE_URL` e sem `JWT_SECRET`.
- Contador `api_requests_total`, incrementado em todo `/api/*` dentro do mesmo isolate.
- `GET /api/metrics` responde `text/plain` com uma linha `api_requests_total <n>`.
- Criar `docs/slo.md`. SLO único: p95 de `GET /api/health` abaixo de 500 ms no smoke local do item 7. O health não acessa o banco; 500 ms é folga, não meta de carga.

O teste de integração do item 3, depois do health, chama `GET /api/metrics` e vê `api_requests_total` maior ou igual a 1.

### 6. Um ADR no formato MADR

Criar `docs/adr/0001-bank-repository.md` com: título, status `aceito`, contexto, opções consideradas, decisão, consequências.

Decisão registrada: dados da conta só passam por `BankRepository`. Opção descartada: componentes chamando Neon. Consequência: duas implementações (memória e HTTP) e domínio sem banco. O parágrafo do item 2 aponta para este arquivo.

Não abrir ADR de ORM, cache ou fila. Isso é Projeto A.

### 7. OpenAPI do health e smoke k6 com p95

- Criar `docs/openapi.yaml`, OpenAPI 3.1, só `GET /api/health`: resposta 200, objeto com `configured`, `database` e `jwt` booleanos obrigatórios. Incluir `GET /api/metrics` no mesmo arquivo, texto plano. Sem lint de OpenAPI no pipeline (isso é Projeto A).
- Criar `perf/health-smoke.js`. Um estágio curto, `GET` em `${BASE_URL}/api/health`. Threshold `http_req_duration` p95 menor que 500 ms, o mesmo número de `docs/slo.md`.
- No README, o comando: `k6 run -e BASE_URL=http://localhost:5173 perf/health-smoke.js`, com o app no ar. k6 não entra no CI.

## Fora de escopo

- Projeto A: contrato Pact, Testcontainers, Codecov, npm audit, Trivy, gitleaks, dois GitHub Environments, métricas RED, trace, feature flag, C4, cache, fila, k6 em três estágios, `EXPLAIN ANALYZE`.
- Trocar Neon por Postgres no Compose, Prisma, TypeORM ou Knex.
- Mudar rotas de negócio, auth, RLS ou o formato do backup.

## Critérios de aceite

1. `docker compose up` sobe o app na porta 5173 sem segundo comando. Segredos continuam só em `.docker/.env` ou no Worker.
2. `docs/arquitetura.md` justifica o Repository e aponta o ADR. `docs/adr/0001-bank-repository.md` tem contexto, opção descartada, decisão e consequências.
3. `src/server/health.integration.spec.ts` sobe HTTP, chama `/api/health` e `/api/metrics`, e passa sem `DATABASE_URL` real.
4. `vite.config.ts` declara os quatro pisos. Os dois workflows falham se o coverage cair abaixo deles.
5. Uma chamada `/api/*` gera uma linha JSON com os seis campos, sem segredo. `/api/metrics` devolve o contador. `docs/slo.md` declara o p95 de 500 ms.
6. `docs/openapi.yaml` descreve o health como na implementação. `perf/health-smoke.js` usa o mesmo limite de 500 ms. O README mostra o comando do k6 e o do Compose.

## Testes

- Integração: health sem config; health com config fictícia e sem rede ao Neon; metrics depois de pelo menos um request.
- Os unitários existentes continuam verdes.
- Coverage: o comando novo respeita o piso gravado na config.
