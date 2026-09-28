# F.OKR Form Output + RAG Idea Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make “Soạn OKR” return F.OKR-form-shaped markdown, export `.md` + `.json`, extend RAG with richer ideas, and optionally add one skill-dev Objective via intake checkbox.

**Architecture:** Prompt + single `knowledge-base.md` sections drive LLM format and idea variety. Frontend intake passes skill-dev flag/note into the compose prompt; export parses last assistant markdown into JSON best-effort.

**Tech Stack:** Angular 19, Express/TS backend, Gemini/OpenAI providers, markdown knowledge base + keyword/embedding RAG.

## Global Constraints

- Output markdown is source of truth; JSON export is best-effort parse.
- Skill-dev OKRs only when intake checkbox is enabled.
- Max 3 Objectives; skill-dev adds at most 1 of those when enabled.
- KR types: Milestone | Currency | Numeric | Percentage.
- Criteria: Higher is better | Lower is better.
- Code comments in English; no commit of `.env` secrets.
- Spec: `docs/superpowers/specs/2026-09-28-okr-form-output-rag-ideas-design.md`

## File map

| File | Responsibility |
|------|----------------|
| `backend/data/knowledge-base.md` | F.OKR template, idea bank, skill-dev rules, updated return format |
| `backend/src/providers/prompt.ts` | System instruction for F.OKR draft format |
| `backend/src/tools/okr.tools.ts` | Validate recognizes new field markers |
| `frontend/src/app/utils/okr-draft-parser.ts` | Parse F.OKR markdown → JSON |
| `frontend/src/app/utils/okr-draft-parser.spec.ts` | Unit tests for parser |
| `frontend/src/app/app.component.ts/html/css` | Intake checkbox/note, prompt, dual export |

---

### Task 1: Knowledge base — F.OKR template + idea bank

**Files:**
- Modify: `backend/data/knowledge-base.md`

- [x] **Step 1: Update return-format in “Quy trình coaching”**
- [x] **Step 2: Soften pure-learning rule + add skill-dev exception**
- [x] **Step 3: Add section `## Mẫu form F.OKR (Edit OKR)`**
- [x] **Step 4: Add section `## Ngân hàng ý tưởng OKR (idea bank)`**
- [x] **Step 5: Commit**

---

### Task 2: System prompt for F.OKR draft shape

**Files:**
- Modify: `backend/src/providers/prompt.ts`

- [ ] **Step 1: Update `OKR_SYSTEM_INSTRUCTION`**

Require draft replies to use the F.OKR markdown field template. Prefer idea-bank variety. If user message includes skill-dev request, allow at most one skill-dev Objective with applied KRs; otherwise work-aligned only.

- [ ] **Step 2: Commit**

```bash
git add backend/src/providers/prompt.ts
git commit -m "Require F.OKR form fields in OKR coach system prompt"
```

---

### Task 3: Validate tool accepts F.OKR markdown

**Files:**
- Modify: `backend/src/tools/okr.tools.ts`

- [ ] **Step 1: Extend objective/KR detection**

Also match `## Objective` / `### Key Result` headings and field lines like `Type of KR:` so new drafts do not fail as `missing_objectives` / `missing_krs`.

- [ ] **Step 2: Smoke-check with node**

```bash
cd backend && npx tsx -e "import { validateOkrDraft } from './src/tools/okr.tools.ts'; console.log(validateOkrDraft('## Objective 1\\n- Content: X\\n### Key Result 1\\n- Type of KR: Percentage\\n- Start: 0\\n- Target: 100\\n- Due date: 31-Dec-2026\\n- Person in charge: TuPH3'));"
```

Expected: no `missing_objectives` / `missing_krs`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/tools/okr.tools.ts
git commit -m "Recognize F.OKR form headings in OKR draft validation"
```

---

### Task 4: Frontend markdown → JSON parser

**Files:**
- Create: `frontend/src/app/utils/okr-draft-parser.ts`
- Create: `frontend/src/app/utils/okr-draft-parser.spec.ts`

**Interfaces:**
- Produces:
  - `export type OkrDraftJson = { objectives: OkrObjectiveJson[] }`
  - `export function parseOkrDraftMarkdown(markdown: string): OkrDraftJson`

- [ ] **Step 1: Write failing unit tests** for one Objective + one KR with all fields; empty input → `{ objectives: [] }`.

- [ ] **Step 2: Implement parser** (split on `## Objective`, then `### Key Result`, parse `- Field: value` lines).

- [ ] **Step 3: Run** `cd frontend && npx ng test --no-watch --browsers=ChromeHeadless --include=src/app/utils/okr-draft-parser.spec.ts`  
  Expected: PASS (if headless unavailable, run `npx tsc` sanity or jasmine via project default).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/utils/okr-draft-parser.ts frontend/src/app/utils/okr-draft-parser.spec.ts
git commit -m "Add F.OKR markdown to JSON draft parser"
```

---

### Task 5: Intake checkbox + compose prompt + dual export

**Files:**
- Modify: `frontend/src/app/app.component.ts`
- Modify: `frontend/src/app/app.component.html`
- Modify: `frontend/src/app/app.component.css`

- [ ] **Step 1: Extend intake model**

```ts
intake = {
  role: '',
  unit: '',
  period: 'Q1',
  upperOkrs: '',
  priorities: '',
  skillDev: false,
  skillDevNote: '',
};
```

- [ ] **Step 2: UI** — checkbox + conditional textarea; Export button label `Export .md + .json`.

- [ ] **Step 3: Update `buildIntakePrompt()`** to require F.OKR field template; when `skillDev`, append skill-dev instructions + note.

- [ ] **Step 4: Update `exportLastOkr()`** to download both `.md` and `.json` via `parseOkrDraftMarkdown`.

- [ ] **Step 5: Manual check** — UI shows checkbox; prompt text includes skill-dev only when checked.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/app.component.ts frontend/src/app/app.component.html frontend/src/app/app.component.css
git commit -m "Add skill-dev intake and dual OKR markdown/JSON export"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1:** `cd backend && npm run build` — success.
- [ ] **Step 2:** `cd frontend && npm run build` — success.
- [ ] **Step 3:** Confirm knowledge-base sections exist (`Mẫu form F.OKR`, `Ngân hàng ý tưởng`).
- [ ] **Step 4:** Mark plan checkboxes done in this file if executing inline.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| F.OKR markdown template | 1, 2, 5 |
| Export `.md` + `.json` | 4, 5 |
| RAG idea bank | 1 |
| Skill-dev opt-in checkbox + note | 5 |
| Validate still works | 3 |
| No interactive form UI | (non-goal) |
