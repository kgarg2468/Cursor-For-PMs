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

### Day 3 (Feb 11) — Auto-Insight Engine v2 ⬜

**Objective:** Expand insight generation to multiple types and add autonomous discovery with priority ranking.

- [ ] Add multiple insight types (trend, anomaly, correlation, segment, opportunity)
- [ ] Implement autonomous discovery — Claude iterates over data dimensions without prompting
- [ ] Build priority/severity ranking system for insights
- [ ] Add insight filtering and sorting UI on dashboard
- [ ] Polish insight card designs (type-specific icons, color coding)
- [ ] Add insight persistence and history view

**Deliverable:** Dashboard surfaces a diverse, prioritized set of insights across all key data dimensions.

---

### Day 4 (Feb 12) — Market Simulation ⬜

**Objective:** Build a Monte Carlo simulation engine so PMs can model "what if" scenarios for feature launches and pricing changes.

- [ ] Implement Monte Carlo simulation engine (Python — NumPy/SciPy)
- [ ] Build feature launch simulator with configurable parameters
- [ ] Add Claude-powered scenario analysis (narrative + quantitative)
- [ ] Create simulation results API endpoints
- [ ] Build simulation UI — parameter inputs, run controls
- [ ] Build results visualization — distribution charts, confidence intervals
- [ ] Connect insights to simulation (e.g., "Simulate fixing this churn driver")

**Deliverable:** User can run "what if" simulations and see projected outcomes with confidence intervals and AI narrative.

---

### Day 5 (Feb 13) — Polish & Integration ⬜

**Objective:** Wire up the chat interface, integrate insights with simulations, and polish the overall UX.

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
| Side Panel Chat UI | 🟡 Partial | Renders, pin/unpin works — no send functionality yet |
| Chat Streaming Backend | ⬜ Not Started | No `/stream` endpoint, no AI responses |
| @ Mention Parsing | ⬜ Not Started | No detection or context injection |
| Monte Carlo Simulation | ⬜ Not Started | No engine, no endpoints |
| Simulation UI | ⬜ Not Started | Placeholder page only |
| Docker | ✅ Complete | Compose + Dockerfiles configured |

---

## What's Left to Build (Prioritized)

1. **Auto-Insight Engine v2** — multiple insight types, autonomous discovery, priority ranking
2. **Monte Carlo simulation engine** — core engine, API, and results UI
3. **Chat backend** — SSE streaming endpoint, Claude conversation with context
4. **Chat frontend wiring** — send messages, display streamed responses
5. **@ mention parsing** — detect in chat input, inject as structured context to Claude
6. **Command bar AI execution** — run queries from Cmd+K
7. **Insights → Simulation workflow** — one-click "simulate this" from insight cards
8. **UX polish** — loading states, skeletons, error handling, dark mode consistency
9. **Demo preparation** — dataset tuning, script, video recording and editing
10. **Documentation & submission** — README, architecture diagram, summary
