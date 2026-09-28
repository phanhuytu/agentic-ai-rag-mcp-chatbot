# Design: F.OKR form output + RAG idea bank

Date: 2026-09-28  
Status: Approved for planning  
Approach: Prompt + knowledge-base extension (Approach 1)

## Problem

“Soạn OKR” currently returns a generic `O1 / KR1 (baseline → target)` draft that does not match the F.OKR Edit OKR form fields (Type of KR, Criteria, Start/Target/Unit, Frequency, etc.). Recommendations also feel generic; users want richer ideas, including optional skill-development OKRs (learn a course → build an app) when explicitly requested.

## Goals

1. Final compose output mirrors F.OKR form fields in markdown.
2. Export both `.md` and `.json` from the last assistant draft.
3. Extend RAG with an idea bank so drafts are less generic.
4. Skill-development OKRs only when the user opts in via intake checkbox + note.

## Non-goals

- Interactive Edit OKR form UI in the app (preview or editable).
- Hard structured JSON mode from the LLM API.
- Splitting knowledge into a second file (keep one `knowledge-base.md`).

## Decisions (from brainstorming)

| Topic | Choice |
|-------|--------|
| Output surface | Chat markdown + Export `.md` and `.json` |
| Skill-dev mix | Default work-aligned only; add personal-dev when opted in |
| Intake control | Checkbox + short note field |
| Implementation | Prompt + KB sections; light parser on FE |

## Output template

Assistant drafts must use this shape:

```text
## Objective 1
- Content: ...
- Owner: ...
- Frequency: Monthly | Quarterly

### Key Result 1
- Content: ...
- Type of KR: Milestone | Currency | Numeric | Percentage
- Criteria: Higher is better | Lower is better
- Start: <number>
- Target: <number>
- Unit: ...
- Person in charge: ...
- Due date: DD-MMM-YYYY
```

### Type selection rules

- **Percentage / Numeric / Currency**: measurable Start → Target with a meaningful Unit.
- **Milestone**: Start `0`, Target `1` (or 0→100%), Unit `done` or `%` for completion milestones.

### JSON export schema

```json
{
  "objectives": [
    {
      "content": "string",
      "owner": "string",
      "frequency": "Monthly | Quarterly | string",
      "keyResults": [
        {
          "content": "string",
          "type": "Milestone | Currency | Numeric | Percentage",
          "criteria": "Higher is better | Lower is better",
          "start": 0,
          "target": 100,
          "unit": "string",
          "personInCharge": "string",
          "dueDate": "string"
        }
      ]
    }
  ]
}
```

Markdown remains the source of truth. JSON is best-effort parse from that markdown; missing fields may be `null` or omitted.

## Intake UX

- Checkbox: “Thêm OKR phát triển kỹ năng (học + ứng dụng)”.
- Textarea note shown when checked (e.g. Coursera AI course + build chatbot).
- Compose user prompt includes skill-dev intent and note only when checked.
- When enabled: at most one skill-dev Objective among ≤3 total Objectives; KRs must include an applied outcome (app/demo/playbook), not course completion alone.
- When disabled: all Objectives stay work-aligned / upper-OKR aligned.

## RAG / knowledge-base changes

Update `backend/data/knowledge-base.md`:

1. **F.OKR form template** — field definitions and examples for Type and Criteria.
2. **Idea bank** — fresher examples: delivery quality, automation, knowledge sharing, and learn→ship→skill patterns (skill patterns retrieved/used when user opts in).
3. **Clarify learning rule** — pure study KRs remain discouraged; skill-dev OKRs are valid when they produce measurable applied outputs.

Also update coaching “return format” section so retrieved context reinforces the new template (not the old O/KR one-liner).

## Prompt changes

`backend/src/providers/prompt.ts` (and compose prompt text from FE):

- Require F.OKR field template on draft requests.
- Prefer idea-bank variety; avoid repeating the same three stock examples.
- Honor skill-dev flag/note when present; otherwise omit personal-dev Objectives.
- Keep existing FPT constraints: ≤3 Objectives, 2–4 KRs each, 6 Rõ, avoid inventing confidential metrics.

## Component / data flow

```text
Intake (role, unit, period, priorities, upper OKRs, [skillDev + note])
  → user compose message
  → agent + RAG (knowledge-base including idea bank)
  → streamed markdown draft (F.OKR fields)
  → Export .md (raw) + .json (parsed)
```

### Files to touch

| Area | Path | Change |
|------|------|--------|
| KB | `backend/data/knowledge-base.md` | Template + idea bank + skill-dev rules |
| Prompt | `backend/src/providers/prompt.ts` | Draft format + conditional skill-dev |
| Agent / compose | FE `generateFromIntake` + agent if needed | Pass skill-dev into message |
| Validate | `backend/src/tools/okr.tools.ts` | Optionally detect new fields when present |
| FE UI | `app.component.ts/html/css` | Checkbox + note |
| FE export | `app.component.ts` (+ small parse util) | Download `.md` and `.json` |

## Error handling

- If LLM omits some fields: still show markdown; JSON parse fills what it can; user can ask to regenerate.
- Export with empty last assistant reply: keep current error (“Chưa có bản OKR để export”).
- No change to streaming/auth behavior in this scope.

## Testing (manual)

1. Compose without skill-dev → work-aligned O/KRs with Type/Criteria/Start/Target/Unit/Due date.
2. Compose with skill-dev + note (Coursera + app) → one skill Objective with applied KR outputs.
3. Export → both files download; JSON matches markdown fields when parse succeeds.
4. Validate tool still runs on the new markdown shape without false “empty” failures.

## Risks

- Markdown→JSON parse fragility → accept best-effort; `.md` is primary.
- Idea bank may still be underused if RAG keyword retrieval misses sections → title/keywords in section headers should be retrieval-friendly.
