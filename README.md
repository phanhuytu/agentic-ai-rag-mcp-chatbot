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

- Gemini chat is live when `GEMINI_API_KEY` is set in `backend/.env`.
- RAG retrieves sections from `backend/data/knowledge-base.md` (FPT OKR playbook).
- Assistant coaches OKR drafting with Align, 5 criteria, 6 Rõ, traps, and CFR.
- Tool endpoints return mock data for later MCP / tool-calling labs.

## Next course increments

1. Wire OpenAI provider + switch embeddings RAG to cosine similarity.
2. Add tool-calling / MCP server around customers, orders, weather.
3. Polish UI (Tailwind / icons) to match course vibe-coding labs.

Course details will be applied as you provide lab notes.
