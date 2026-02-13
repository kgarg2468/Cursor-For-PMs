# Product Insight Autopilot — Progress

> "Cursor for PMs" — AI-powered product intelligence platform
> **Hackathon deadline: February 16, 2026**

---

## Phase Progress

### Day 1 (Feb 9) — Foundation ✅

**Objective:** Stand up the full-stack skeleton with data ingestion so every subsequent day builds on a working app.

- [x] Scaffold React 18 + TypeScript + Vite frontend
- [x] Scaffold FastAPI backend with async setup
- [x] Configure Tailwind CSS (dark-mode-first) and shadcn/ui
- [x] Implement CSV upload endpoint (`POST /api/datasets/upload`)
- [x] Implement CSV parsing and SQLite storage (aiosqlite, WAL mode)
- [x] Build data preview UI (upload flow + table view)
- [x] Create and load demo SaaS dataset (~500 accounts)
- [x] Set up Docker Compose for one-command startup
- [x] Wire frontend API layer (`src/lib/api.ts`)

**Deliverable:** App boots, user can upload CSV or load demo data, data previews in-browser.

---

### Day 2 (Feb 10) — Auto-Insight Engine v1 ✅

**Objective:** Connect Claude Opus 4.6 to the data pipeline and stream AI-generated insights to the dashboard in real time.

- [x] Build Claude async client wrapper (`app/services/claude_client.py`) with extended thinking
- [x] Implement insight generation service with structured JSON output
- [x] Set up SSE streaming (`StreamingResponse` with `text/event-stream`)
- [x] Build `useSSE` hook for frontend streaming consumption
- [x] Implement KPI computation service (MRR, churn, NPS, active accounts)
- [x] Build dashboard layout with KPI cards and trend indicators
- [x] Build `InsightCard` component with expand/collapse
- [x] Build `AlertBanner` component for critical insights
- [x] Build `MiniChart` components (sparklines via Nivo)
- [x] Implement insight expand endpoint with detailed Claude reasoning
- [x] Add DB caching for expanded insights
- [x] Fix expand error handling (graceful fallback)
- [x] Fix dashboard grid stretch issues
- [x] Fix chart sizing and responsive layout
- [x] Make suggested questions clickable

**Deliverable:** Dashboard shows live KPIs, streams AI insights with thinking visualization, cards expand with detailed reasoning.

---

### Day 3 (Feb 11) — Auto-Insight Engine v2 + Design Polish ✅

**Objective:** Expand insight generation to multiple types and polish dashboard UX.

- [x] Add multiple insight types (8 types: trend, anomaly, correlation, segment, opportunity, etc.)
- [x] Implement impact scoring and priority ranking for insights
- [x] Add insight filtering and sorting UI on dashboard
- [x] Polish insight card designs (type-specific icons, color coding)
- [x] Masonry grid layout (CSS columns) with responsive breakpoints
- [x] Charts moved below description (full-width, data-scaled height)
- [x] Fixed budget_tokens 400 error (1000 → 1024)
- [x] Side panel chat wired up with multi-turn streaming + pinned context injection

**Deliverable:** Dashboard surfaces a diverse, prioritized set of insights with polished card designs and working chat.

---

### Day 4 (Feb 12) — Agentic Simulation Engine 🟡

**Objective:** Transform the simulation from a passive tool into a proactive agent that suggests strategic interventions and drafts execution plans.

- [x] Build simulation engine with Claude-powered scenario analysis (`simulation_engine.py`)
- [x] Create 3 simulation templates (SSO Tax, Usage-Based Pricing, Free Tier Expansion) with node maps
- [ ] Implement "Agentic Triggers" — Insight automatically triggers specific simulation scenarios
- [ ] Build "Impact Story" UI — Explicit "Status Quo" vs "Opus Strategy" comparison
- [ ] Implement Artifact Generation — Auto-draft emails, PDFs, and tickets based on simulation results (mocked for speed)
- [ ] Connect insights to simulation (e.g., "Simulate fixing this churn driver")

**Deliverable:** System proactively suggests "What If" scenarios and provides a complete decision package (Graph + Impact Analysis + Drafted Assets).

---

### Day 5 (Feb 13) — Integration & Polish ⬜

**Objective:** Wire up the chat interface, integrate insights with simulations, and polish the overall UX for the "Chief Strategy Officer" feel.

- [ ] Implement chat streaming backend (`/api/chat/stream` SSE endpoint)
- [ ] Wire side panel chat send functionality
- [ ] Implement `@` mention parsing (`@dataset:name`, `@insight:id`, `@simulation:id`)
- [ ] Build insights-to-simulation workflow (one-click from insight card)
- [ ] Refine dark mode (consistent theming across all components)
- [ ] Add loading states and skeleton screens
- [ ] Add comprehensive error handling and user-friendly error messages
- [ ] Command bar AI query execution

**Deliverable:** Chat works end-to-end with context injection, insights flow into simulations, app feels polished.

---

### Day 6 (Feb 14) — Demo Preparation ⬜

**Objective:** Prepare a compelling 3-minute demo video showcasing the full product loop.

- [ ] Tune demo dataset for impressive insight outputs
- [ ] Write 3-minute demo script (problem → upload → insights → simulation → chat)
- [ ] Record screen capture of full demo flow
- [ ] Record voiceover narration
- [ ] Edit video (cuts, transitions, captions)

**Deliverable:** Polished 3-minute demo video ready for submission.

---

### Day 7 (Feb 15–16) — Documentation & Submission ⬜

**Objective:** Document the project and submit before the deadline.

- [ ] Write comprehensive README (setup, architecture, usage)
- [ ] Add inline code comments where needed
- [ ] Create architecture diagram
- [ ] Write 100–200 word project summary
- [ ] Final testing pass
- [ ] Submit to hackathon

**Deliverable:** Project submitted with documentation, video, and summary.

---

## Feature Status

| Feature | Status | Details |
|---|---|---|
| CSV Upload + Data Ingestion | ✅ Complete | Upload, parse, preview, demo dataset loader |
| Database (SQLite) | ✅ Complete | All tables, WAL mode, cascade deletes |
| Claude Client | ✅ Complete | Async streaming wrapper, extended thinking enabled |
| KPI Computation | ✅ Complete | MRR, churn, NPS, active accounts with trends |
| Auto-Insight Generation (SSE) | ✅ Complete | Streaming insights with thinking step visualization |
| Insight Expand (detailed reasoning) | ✅ Complete | Claude analysis with DB caching + error fallback |
| Dashboard UI | ✅ Complete | KPIs, InsightCards, AlertBanner, MiniCharts, progress indicators |
| Command Bar (Cmd+K) | 🟡 Partial | Opens, shows items — no AI query execution yet |
| Side Panel Chat | ✅ Complete | Multi-turn streaming, pinned context chips, thinking bubbles |
| Chat Streaming Backend | ✅ Complete | SSE endpoint with multi-turn + pinned context injection |
| @ Mention Parsing | ⬜ Not Started | No detection or context injection |
| Agentic Simulation Engine | 🟡 In Progress | Migrating to proactive triggers and artifact generation |
| Simulation UI | 🟡 Updating | Adding "Impact Story" comparison view |
| Simulation Performance Fix | ✅ Complete | Sonnet 4.5, budget_tokens=1024, max_tokens=8000, streamlined prompts |
| Docker | ✅ Complete | Compose + Dockerfiles configured |

---

## What's Left to Build (Prioritized)

1.  **Agentic Simulation Workflow** — Proactive triggers, Impact Story UI, Artifact Generation
2.  **Insights → Simulation Connection** — One-click "Simulate Strategy"
3.  **@ mention parsing** — detect in chat input, inject as structured context to Claude
4.  **Command bar AI execution** — run queries from Cmd+K
5.  **UX polish** — loading states, skeletons, error handling, dark mode consistency
6.  **Demo preparation** — dataset tuning, script, video recording and editing
7.  **Documentation & submission** — README, architecture diagram, summary
