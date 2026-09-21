# MCP / tool-calling layer

This folder holds an in-process tool registry used by Coursera-style agent labs.

## Registered OKR tools

| Tool | Purpose |
|------|---------|
| `validate_okr_draft` | Quick FPT checklist on a draft |
| `list_okr_playbook_sections` | List KB section titles |
| `get_okr_playbook_section` | Fetch one KB section |

## HTTP surfaces

- `GET /api/okr/tools`
- `POST /api/okr/validate` `{ "draft": "..." }`
- `GET /api/okr/playbook/sections`
- `GET /api/okr/playbook/section?title=6%20Rõ`
- `POST /api/okr/tools/:name` with JSON body args

## Next

Wrap `tool-registry.ts` with a real MCP server (stdio/SSE) when the course reaches that lab.
