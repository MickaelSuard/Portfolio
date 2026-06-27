# Agent Instructions

- Do not run `npm run build` after every change.
- Prefer targeted checks for the files or behavior being edited.
- Run a full build only when the user asks for it, when changing build configuration or dependencies, or when the change is broad enough that a build is genuinely useful.
- If a dev server is already running, reuse it instead of starting another one.
- Never run browser tests or browser automation unless the user explicitly asks for it.
