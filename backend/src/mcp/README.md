# MCP / tool-calling placeholders

This folder is reserved for MCP server wiring from the course.

Planned tool surfaces (already exposed as REST stubs on the backend):

- `GET /api/customers` — list or fetch customers
- `GET /api/orders` — list or fetch orders
- `GET /api/weather?city=` — weather lookup (mock)

Next labs can wrap these endpoints as MCP tools the LLM can call.
