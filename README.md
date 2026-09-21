# Agentic AI RAG + MCP Chatbot

Scaffold for the Coursera course
[Agentic AI Foundations: Build RAG & MCP Chatbots](https://www.coursera.org/learn/agentic-ai-foundations-rag-mcp-chatbots/).

Full-stack starter: **Angular** chat UI + **Node.js/Express (TypeScript)** backend with RAG and tool stubs.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 19, reactive chat UI |
| Backend | Node.js, Express, TypeScript |
| LLM providers | Gemini + OpenAI scaffolds (wire SDKs in labs) |
| RAG | Local FAQ knowledge base + keyword retrieval (upgrade to embeddings later) |
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
- API keys later (optional for scaffold): Google Gemini and/or OpenAI

## Quick start

```bash
# Backend
cd backend
copy .env.example .env   # Windows
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

## Current behavior (scaffold)

- Chat works **without API keys** via placeholder provider replies.
- RAG keyword match over `backend/data/knowledge-base.md`.
- Tool endpoints return mock data for later MCP / tool-calling labs.

## Next course increments

1. Implement real Gemini / OpenAI `generateResponse` + embeddings.
2. Replace keyword RAG with cosine-similarity ranking.
3. Add tool-calling / MCP server around customers, orders, weather.
4. Polish UI (Tailwind / icons) to match course vibe-coding labs.

Course details will be applied as you provide lab notes.
