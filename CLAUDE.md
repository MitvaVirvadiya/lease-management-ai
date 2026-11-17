# CLAUDE.md — lease-management-ai

## Layout (npm workspaces)

| App | Package | What it is | Stack |
|---|---|---|---|
| `apps/web` | `@lease-os/web` | Frontend | Next.js 15, Park UI, Panda CSS |
| `apps/api` | `@lease-os/api` | REST API, DB owner | NestJS (CommonJS), Drizzle, postgres.js |
| `apps/agents` | `@lease-os/agents` | All AI agents (compliance/RAG now; voice or others later) | Plain TypeScript, ESM, vitest |

## Boundaries

- **Agents stay out of the REST API.** `apps/api` must not hold agent loops, prompts or RAG logic. `apps/agents` must not hold CRUD routes or UI.
- The web app talks to the REST API for normal data. It talks to `apps/agents` only for agent features (chat, voice, compliance checks).
- Agents may call the REST API when they need lease data. The API may call agents. Neither imports the other's source: use HTTP, or a small shared package if one is ever needed.
- One folder per agent under `apps/agents/src/` (e.g. `ingest/`, later `compliance/`, `voice/`). A new agent type gets a new folder, not a new app, until it needs its own deploy.
- `apps/agents` is ESM (`"type": "module"`, `.js` import suffixes). `apps/api` is CommonJS. Do not mix them.

## Commands

- `npm run dev:agents`, `npm run test:agents`
- `npm run typecheck -w @lease-os/agents`
- `npm run format` (Prettier, one-line style: `printWidth` 1000, `objectWrap: collapse`; also runs on save in VS Code)
- Postgres: `docker compose up -d`, `DATABASE_URL` only.

## Working rules for AI assistants

- **Frontend and REST API:** assistants may write the code.
- **Agents (`apps/agents`) is a learning project.** The owner writes the core logic by hand: ingest, chunking, embeddings, retrieval, scoring, tool loops, failure handling. Assistants may write boilerplate and tooling (setup, tsconfig, compose, config, env templates, scripts) and review the owner's code. When asked for help, use this ladder, one rung at a time: a guiding question, a docs pointer, a 3-5 line syntax pattern, and pseudocode only after a long stall.
- Review like a strict staff engineer: ask why, name failure modes (retries, races, latency, token limits), ask one question at a time.
- Do not push, open PRs or delete repos without being asked. Never commit `.env`.

## Current state

- `apps/agents/src/ingest/`: PDF text extraction (`unpdf`) with quality checks and typed errors (`PdfProcessingError`: `INVALID_PDF`, `PASSWORD_PROTECTED`, `EMPTY_PDF`, `NO_EXTRACTABLE_TEXT`, `LOW_TEXT_DENSITY`). Tested against `apps/agents/docs/*.pdf`.
- Next for agents: chunking, embeddings (pgvector), rulebook retrieval, score and `approved | human_review | rejected`.
