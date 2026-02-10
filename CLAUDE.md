# Product Insight Autopilot

AI-powered product intelligence platform — "Cursor for PMs". Hackathon project (Claude Code Hackathon, deadline Feb 16).

## Project Structure

- `frontend/` — React 18 + TypeScript + Vite app
- `backend/` — FastAPI (Python) API server
- `plans/` — Planning docs (do not modify during implementation)
- `docker-compose.yml` — One-command setup

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (dark-mode-first), shadcn/ui, Nivo (charts), Zustand (state), React Router
- **Backend:** FastAPI, Python 3.11+, Pandas, NumPy, SciPy, aiosqlite, Anthropic SDK
- **AI:** Claude Opus 4.6 with extended thinking enabled
- **Streaming:** Server-Sent Events (SSE) for all AI responses
- **Database:** SQLite
- **Deployment:** Docker Compose

## Commands

### Frontend
- `cd frontend && npm run dev` — Start dev server (port 5173)
- `cd frontend && npm run build` — Production build
- `cd frontend && npm run lint` — Lint check
- `cd frontend && npx shadcn@latest add <component>` — Add shadcn/ui component

### Backend
- `cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000` — Start dev server
- `cd backend && pip install -r requirements.txt` — Install dependencies

### Docker
- `docker-compose up --build` — Run full stack
- `docker-compose down` — Stop

## Code Conventions

### Frontend
- Use TypeScript strict mode. No `any` types.
- Components: functional components with arrow functions, one component per file
- Naming: PascalCase for components, camelCase for hooks/utils, kebab-case for CSS classes
- State: Zustand stores in `src/stores/`. No prop drilling more than 2 levels — use store instead.
- Styling: Tailwind utility classes. Use CSS variables for theme colors (defined in `globals.css`). Dark mode via `class` strategy.
- shadcn/ui: Always use shadcn components before building custom ones. Install with `npx shadcn@latest add <name>`.
- Charts: Use `@nivo/*` packages. Wrap in `ChartWidget` for consistent sizing/theming.
- API calls: Use typed fetch wrappers in `src/lib/api.ts`. Never call fetch directly from components.
- SSE: Use the `useSSE` hook in `src/hooks/useSSE.ts` for all streaming endpoints.

### Backend
- Type hints on all function signatures
- Pydantic models for all request/response schemas (in `app/models/schemas.py`)
- Async everywhere — use `async def` for all route handlers and service methods
- Claude API calls go through `app/services/claude_client.py` — never import anthropic directly in routes
- SSE responses use `StreamingResponse` with `text/event-stream` content type
- Each SSE event is a JSON object with a `type` field: `thinking`, `insight`, `progress`, `complete`, `error`
- Database operations in `app/models/database.py` using aiosqlite
- Environment variables via pydantic-settings (`app/core/config.py`)

### Design System
- **Dark mode first.** Build dark mode, then add light mode support.
- **Design inspiration:** Stripe Dashboard + Vercel Dashboard + Salesforce Lightning
- **Colors:** Claude orange `#D97757` (dark) / `#CC785C` (light) as primary accent. Neutral grays from Salesforce scale.
- **Typography:** System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Spacing:** 8px grid system (Tailwind defaults)
- **Border radius:** `0.5rem` for cards, `0.375rem` for buttons, `0.25rem` for badges
- **Shadows:** Subtle. `shadow-sm` for cards, `shadow-md` for elevated elements (command bar, dropdowns)

### AI Interaction Patterns (Cursor-like)
- **Cmd+K command bar:** Global shortcut, opens spotlight-style dialog. Supports `@` mentions.
- **Side panel chat:** Collapsible right panel (400px). Expandable to full-width.
- **Card pinning:** Insight cards can be pinned to chat context. Pinned cards = chips above chat input.
- **@ mentions:** `@dataset:name`, `@insight:id`, `@simulation:id` — parsed in chat input, sent as structured context.
- **Streaming:** All AI responses stream via SSE. Show thinking bubbles during processing.
- **Suggested questions:** Global (dashboard-level) + contextual (per insight card).

## Important Notes

- This is a hackathon project. Prioritize working demo over perfect code.
- Never hardcode API keys. Use `.env` file (not committed).
- The demo dataset is a developer tools SaaS platform (~500 accounts).
- All AI calls use Opus 4.6 with extended thinking enabled.
- Keep the Claude API budget_tokens reasonable (1000-2000 for analysis, 500 for quick responses).
