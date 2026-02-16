# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

AI-powered product intelligence platform — "Cursor for PMs". Hackathon project (Claude Code Hackathon, deadline Feb 16). A React + FastAPI app where PMs upload SaaS datasets and get AI-generated insights, run graph-based simulations, and interact with Claude via chat/command bar.

## Commands

### Frontend
- `cd frontend && npm run dev` — Dev server (port 5173)
- `cd frontend && npm run build` — TypeScript check + Vite production build
- `cd frontend && npm run lint` — ESLint
- `cd frontend && npx shadcn@latest add <component>` — Add shadcn/ui component

### Backend
- `cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000` — Dev server
- `cd backend && pip install -r requirements.txt` — Install deps
- `cd backend && python3 generate_demo_data.py` — Regenerate demo CSV

### Docker
- `docker-compose up --build` — Full stack
- `docker-compose down` — Stop

## Architecture

### Frontend (`frontend/src/`)
- **React 18 + TypeScript + Vite**, React Router v7, Tailwind CSS, shadcn/ui
- **Pages:** `pages/DashboardPage.tsx` (insights), `SimulationsPage.tsx` (graph simulations), `DataSourcesPage.tsx` (upload), `IntegrationsPage.tsx`
- **Layout:** `components/layout/AppShell.tsx` wraps all routes — provides Header, SidePanel (chat), CommandBar (Cmd+K)
- **State:** 5 Zustand stores in `stores/` with session storage persistence:
  - `appStore` — theme, active dataset, UI toggles (sidePanel open, commandBar open)
  - `chatStore` — conversations, messages, pinned insight cards, streaming state
  - `insightStore` — insights array, KPIs, generation progress, filters/sort
  - `simulationStore` — templates, node params, results (fan/tornado/histogram/scenario/VaR), agentic mode
  - `actionPlanStore` — selected action items
- **API layer:** `lib/api.ts` — typed fetch wrappers (`dataApi`, `insightsApi`, `simulationsApi`, `chatApi`). Never call fetch directly from components.
- **SSE:** `lib/sse.ts` has two strategies: `connectSSE()` (GET, EventSource) and `connectPostSSE()` (POST, fetch + ReadableStream). Hooks use these, not raw EventSource.
- **Hooks:** `useChat`, `useInsights`, `useSimulation`, `useSSE`, `useActionGeneration` — each manages streaming + store updates for its domain
- **Simulation graph:** ReactFlow canvas in `components/simulation/SimulationCanvas.tsx` with custom node types (`SourceNode`, `ModifierNode`, `SinkNode`). Nodes appear one-by-one with animated build-up.
- **Charts:** Nivo (`@nivo/*`). Result charts in `components/simulation/results/` — FanChart, TornadoChart, HistogramChart, ScenarioTable, VaRCard.

### Backend (`backend/app/`)
- **FastAPI** with async everywhere, SQLite via aiosqlite
- **Routes** (`api/`): `data.py`, `insights.py`, `simulations.py`, `chat.py` — mounted at `/api/*`
- **Services** (`services/`):
  - `claude_client.py` — Anthropic SDK wrapper. `stream_completion()` and `stream_chat()` yield `{type, content}` events. Uses Opus 4.6 with thinking for analysis, Sonnet 4.5 (`complete_no_thinking()`) for fast tasks.
  - `insight_engine.py` — `generate_insights()` analyzes dataset → yields 5-8 typed insights. `generate_actions()` creates action items per insight.
  - `simulation_engine.py` — `run_simulation()` sends graph description to Claude → returns fan_chart, tornado_chart, histogram, scenario_table, var_card, summary as JSON.
  - `agentic_simulation.py` — `run_agentic_simulation()` generates 3 scenarios from an insight, runs each, compares outcomes, ranks by projected impact.
  - `data_processor.py` — `get_dataset_summary()` and `compute_kpis()` for dataset stats.
  - `artifact_generator.py` — generates documents (PRDs, Slack messages, emails, Jira tickets) from simulation results.
- **Models:** `models/database.py` (SQLite schema + `get_db()` + `init_db()`), `models/schemas.py` (Pydantic)
- **Config:** `core/config.py` via pydantic-settings, reads from `.env`
- **Database:** `backend/data/autopilot.db`. WAL mode enabled. Tables: datasets, dataset_rows, insights, action_items, simulations, conversations, messages, agentic_simulations.

### Key Data Flows

**Insight Generation:** User clicks generate → `GET /api/insights/generate?dataset_id=X` (SSE) → `insight_engine.generate_insights()` → Claude analyzes dataset summary → yields `progress`, `thinking`, `insight` events → frontend adds each insight to `insightStore` → InsightCard components render.

**Simulation Run:** User adjusts node params → `POST /api/simulations/run-graph` (SSE) → `simulation_engine.run_simulation()` → Claude receives human-readable graph description + params → returns JSON with 6 chart types → frontend `simulationStore` updates → Nivo charts render in Results tab.

**Chat with Pinned Context:** User pins insight cards → sends message → `POST /api/chat/conversations/{id}/stream` with `pinned_context` (insight IDs) → backend loads insight details from DB, includes in system prompt → Claude streams response → frontend renders markdown.

**Agentic Simulation:** Triggered from insight card → `POST /api/simulations/agentic/trigger` → generates 3 scenarios → runs each through simulation engine → compares → yields `scenario_result`, `comparison_ready`, `complete` events → `AgenticSimulationView` displays.

### SSE Event Protocol
All streaming endpoints use `StreamingResponse` with `text/event-stream`. Events are JSON: `{type, data}`. Common types: `progress` (step text), `thinking` (Claude thinking), `text`/`text_start` (response text), `insight`/`action`/`scenario_result` (domain objects), `complete`, `error`.

## Code Conventions

### Frontend
- TypeScript strict mode, no `any`
- PascalCase components, camelCase hooks/utils, one component per file
- Zustand stores for state — no prop drilling beyond 2 levels
- shadcn/ui components before custom ones
- Dark mode first via `class` strategy, CSS variables in `styles/globals.css`

### Backend
- Type hints on all functions, Pydantic models for all request/response
- `async def` everywhere — routes, services, DB ops
- All Claude calls through `services/claude_client.py` — never import anthropic in routes
- DB pattern: `db = await get_db()` → try/finally with `await db.close()`

### Design System
- Dark mode first. Colors: Claude orange `#D97757` (dark) / `#CC785C` (light) as accent
- Inspiration: Stripe + Vercel + Salesforce Lightning
- System font stack, 8px grid, `0.5rem` card radius, subtle shadows (`shadow-sm` cards, `shadow-md` elevated)

### AI Patterns
- Cmd+K command bar: spotlight-style dialog, navigation + AI actions
- Side panel chat: collapsible right panel (400px), expandable full-width
- Card pinning: insight cards pinned as context chips above chat input
- All AI responses stream via SSE with thinking bubbles during processing
- Claude API: budget_tokens 1000-2000 for analysis, 500 for quick responses

## Important Notes
- Hackathon project — prioritize working demo over perfect code
- Demo dataset: developer tools SaaS platform (~500 accounts)
- Never hardcode API keys — use `.env` (not committed)
- Opus 4.6 with extended thinking for analysis; Sonnet 4.5 for fast responses (simulations, node context)
