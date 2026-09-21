# Agentic AI RAG + MCP Chatbot

Scaffold for the Coursera course
[Agentic AI Foundations: Build RAG & MCP Chatbots](https://www.coursera.org/learn/agentic-ai-foundations-rag-mcp-chatbots/).

Full-stack starter: **Angular** chat UI + **Node.js/Express (TypeScript)** backend with RAG and tool stubs.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 19, reactive chat UI |
| Backend | Node.js, Express, TypeScript |
| LLM providers | Gemini (live via `@google/genai`) + OpenAI scaffold |
| RAG | Knowledge base OKR FPT (5 tiêu chí, 6 Rõ, CFR, coaching flow) |
| Tools / MCP | REST stubs for customers, orders, weather |

## Project layout

```text
agentic-ai-rag-mcp-chatbot/
├── frontend/                 # Angular chat app
├── backend/
│   ├── data/knowledge-base.md
│   └── src/
│       ├── controllers/
│       ├── providers/        # gemini + openai
│       ├── routes/
│       ├── services/rag.service.ts
│       └── mcp/              # reserved for MCP labs
├── package.json              # root helper scripts
└── README.md
```

## Prerequisites

- Node.js 20+
- Gemini API key in `backend/.env` (never commit this file)

## Get a Gemini API key (keep it private)

1. Open [Google AI Studio – API keys](https://aistudio.google.com/apikey) and sign in with your Google account.
2. Click **Create API key** (or use an existing key).
3. Copy the key **only into** `backend/.env` on your machine:

```env
GEMINI_API_KEY=your_key_here
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-3.6-flash
```

4. Do **not** paste the key into chat, GitHub, screenshots, or commits. `.env` is gitignored; only `.env.example` is tracked.

After changing `.env`, **restart** the backend (`Ctrl+C` then `npm run dev`) so dotenv reloads the key.

## Quick start

```bash
# Backend
cd backend
copy .env.example .env   # Windows — then edit .env and set GEMINI_API_KEY
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

- UI: http://localhost:4200  
- API health: http://localhost:3000/health  
- Chat: `POST http://localhost:3000/api/chat` with `{ "message": "What is RAG?" }`

From repo root you can also use:

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
```

## Current behavior

- Gemini/OpenAI chat with **embedding RAG** over FPT OKR knowledge base.
- **Agent tools (demo):** chat may auto-call `validate_okr_draft` / `get_okr_playbook_section`.
- **Streaming:** `POST /api/chat/stream` (SSE) — UI shows status + chunked reply.
- **Auth (optional):** set `API_ACCESS_TOKEN` in `backend/.env`; UI stores Bearer token in sessionStorage.
- Product UI: intake form, validate, export Markdown, local history.

See plan: `docs/superpowers/plans/2026-09-21-coursera-refactor-product.md`.

## Next course increments

1. Real MCP stdio server (local / separate host — not required for this Vercel-friendly demo).
2. Token streaming from the LLM provider (current demo chunks the final answer).
