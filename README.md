# Agentic AI RAG + MCP Chatbot

Scaffold for the Coursera course
[Agentic AI Foundations: Build RAG & MCP Chatbots](https://www.coursera.org/learn/agentic-ai-foundations-rag-mcp-chatbots/).

Full-stack starter: **Angular** chat UI + **Node.js/Express (TypeScript)** backend with RAG and tool stubs. Deployable on **Vercel** (static FE + serverless API).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 19 chat UI |
| Backend | Node.js, Express, TypeScript |
| LLM | Gemini (`@google/genai`) + OpenAI |
| RAG | FPT OKR knowledge base (embedding locally; keyword default on Vercel) |
| Tools | In-process registry + `/api/okr/*` (MCP-style demo) |

## Project layout

```text
agentic-ai-rag-mcp-chatbot/
├── api/index.ts              # Vercel serverless entry (Express)
├── vercel.json
├── frontend/                 # Angular app
├── backend/
│   ├── data/knowledge-base.md
│   └── src/
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20+
- Gemini API key (never commit)

## Get a Gemini API key (keep it private)

1. Open [Google AI Studio – API keys](https://aistudio.google.com/apikey).
2. Create / copy a key **only into** `backend/.env` (local) or Vercel Environment Variables (deploy).
3. Never paste the key into chat, GitHub, or commits.

```env
GEMINI_API_KEY=your_key_here
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-3.6-flash
```

## Quick start (local)

```bash
# Backend
cd backend
copy .env.example .env   # Windows — then set GEMINI_API_KEY
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

- UI: http://localhost:4200  
- API: http://localhost:3000/api/health  

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
```

## Deploy on Vercel (full stack)

1. Push repo to GitHub (already done if you followed earlier steps).
2. [vercel.com](https://vercel.com) → **Add New Project** → import this repo.
3. Framework preset: **Other** (vercel.json is provided).
4. Set **Environment Variables** (Production):

| Name | Example | Notes |
|------|---------|--------|
| `GEMINI_API_KEY` | (secret) | Required |
| `LLM_PROVIDER` | `gemini` | |
| `GEMINI_MODEL` | `gemini-3.6-flash` | |
| `CORS_ORIGIN` | `*` | Or your `https://….vercel.app` URL |
| `RAG_MODE` | `keyword` | Recommended on Hobby (fast/cold-start safe) |
| `API_ACCESS_TOKEN` | optional | If set, UI must send Bearer token |

5. Deploy. Open the Vercel URL — FE and `/api/*` share the same origin (`apiBaseUrl` empty in production).
6. Check `https://<app>.vercel.app/api/health`.

Optional CLI:

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

**Notes for Vercel serverless**

- Default RAG on Vercel is **keyword** (set `RAG_MODE=embedding` only if you accept slower cold starts / higher limits).
- Streaming uses SSE (`/api/chat/stream`); keep `maxDuration` (60) in mind on your plan.
- Real MCP stdio servers are **not** hosted on Vercel — keep them local if needed.

## Current behavior

- Chat + agent tools + SSE streaming + optional Bearer auth.
- Intake form, validate, export Markdown, local history.
- Plan: `docs/superpowers/plans/2026-09-21-coursera-refactor-product.md`.
