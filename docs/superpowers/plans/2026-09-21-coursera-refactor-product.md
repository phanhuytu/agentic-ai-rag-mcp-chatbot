# Coursera → Refactor → Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Coursera agentic foundations (embedding RAG, dual LLM providers, tool-calling), then clean TypeScript structure, then productize the FPT OKR coach.

**Architecture:** Angular chat UI → Express API → LLM provider (Gemini/OpenAI) + embedding RAG over FPT OKR knowledge base → optional tools (OKR validate / playbook lookup) exposed as REST and MCP-style registry.

**Tech Stack:** Angular 19, Node/Express/TypeScript, `@google/genai`, `openai`, in-memory embedding index + cosine similarity.

---

## Phase 1 — Bám Coursera

### Task 1: Embedding RAG + cosine similarity

**Files:**
- Modify: `backend/src/services/rag.service.ts`
- Create: `backend/src/services/similarity.ts`
- Create: `backend/src/services/knowledge-loader.ts`
- Modify: `backend/src/controllers/chat.controller.ts` (pass provider for embeddings)

- [ ] Load KB chunks from markdown `##` sections
- [ ] Embed chunks once (lazy cache) via active LLM provider
- [ ] Rank query vs chunks with cosine similarity, return top-k
- [ ] Fallback to keyword RAG if embeddings unavailable
- [ ] Smoke-test `/api/chat` with `useRag:true`

### Task 2: OpenAI provider

**Files:**
- Modify: `backend/src/providers/openai.provider.ts`
- Modify: `backend/src/providers/index.ts`
- Modify: `backend/package.json` (`openai` dependency)
- Modify: `backend/.env.example`

- [ ] Implement chat + embeddings with official SDK
- [ ] Share OKR system instruction helper
- [ ] Switch via `LLM_PROVIDER=openai`

### Task 3: Tool-calling / MCP stubs (OKR tools)

**Files:**
- Create: `backend/src/tools/okr.tools.ts`
- Create: `backend/src/mcp/tool-registry.ts`
- Create: `backend/src/routes/okr.routes.ts`
- Create: `backend/src/controllers/okr.controller.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/src/mcp/README.md`

- [ ] Tools: `validate_okr_draft`, `list_okr_playbook_sections`, `get_okr_playbook_section`
- [ ] REST under `/api/okr/*`
- [ ] Registry usable later by MCP server / agent loop
- [ ] Keep legacy course stubs (`customers`, `orders`, `weather`) until productization cleanup

---

## Phase 2 — Refactor TypeScript routes/controllers

**Files:**
- Reorganize under `backend/src/modules/{chat,okr,tools}/` OR keep flat but unify patterns
- Shared: `errors.ts`, `async-handler.ts`, typed request bodies
- Ensure `npm run build` clean

---

## Phase 3 — Sản phẩm hóa

- OKR intake form (role, unit, period, upper OKRs)
- Session / chat history
- Export Markdown/CSV for F.OKR
- UI polish + streaming replies
- Light auth if needed for internal use

---

## Execution order (this session)

1. Complete Phase 1 Tasks 1–3  
2. Then Phase 2 refactor  
3. Then Phase 3 product features (incremental)
