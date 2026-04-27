---
applyTo: "**/*.go,backend/**,main.go,app.go"
---

Read `AGENTS.md`, `MEMORY.md`, and `.ai/instructions/backend.md` before editing backend files.

Rules:
- Keep Wails Binding methods serializable and explicit.
- Let SQLite be the source of truth after CSV import.
- Use transactions for multi-table writes.
- Update `MEMORY.md` after meaningful backend changes.

