# Improvement Plan — Priorities 2–8

Detailed implementation specs for each improvement, ordered by score-per-hour impact.

---

## Priority 2: Surface Claude's Extended Thinking as Reasoning Traces (+6 pts Opus Use)

**Goal:** Make Claude's "thinking" visible and inspectable rather than discarding it. This demonstrates Opus 4.6's unique extended thinking capability to judges.

### Currently

- [claude_client.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/claude_client.py) emits `{"type": "thinking", "content": "..."}` events during streaming
- [insight_engine.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/insight_engine.py) captures thinking text in `thinking_buffer` and yields `{"type": "thinking"}` events
- Frontend shows a "Claude is thinking..." indicator but **discards thinking content**
- The thinking text is never stored or surfaced

### Changes

#### Backend

##### [MODIFY] [insight_engine.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/insight_engine.py)

- In the `generate_insights` function, yield the actual thinking content: `yield {"type": "thinking", "data": {"content": thinking_chunk}}`
- After insight generation completes, include the full thinking trace in the insight's saved data
- Add a `thinking_trace` field to the insight DB record

##### [MODIFY] [chat.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/api/chat.py)

- In `stream_chat`, forward the thinking content chunks to the frontend SSE stream as `{"type": "thinking", "data": {"content": "..."}}`

##### [MODIFY] Database schema (init in `database.py`)

- Add `thinking_trace TEXT` column to the `insights` table

#### Frontend

##### [MODIFY] [GenerationProgress.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/dashboard/GenerationProgress.tsx)

- Instead of showing "Claude is thinking...", display a collapsible `<details>` accordion showing the live thinking text as it streams in
- Style it with a mono font, slightly dimmed, with a 🧠 icon header: "Claude's Reasoning"
- Auto-scroll to bottom as new thinking content arrives

##### [MODIFY] [InsightCard.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/dashboard/InsightCard.tsx)

- When expanding an insight card, if `thinking_trace` exists on the insight, show a "View Claude's Reasoning" collapsible section below the AI reasoning
- This gives judges a way to inspect HOW Claude reached each conclusion

##### [MODIFY] [insightStore.ts](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/stores/insightStore.ts)

- Add `thinkingTrace?: string` to the insight state type
- Store thinking content as it streams in

##### [MODIFY] Chat SidePanel components

- Show thinking content inline during chat streaming with a "thinking" animation
- Display it as a collapsible block above the assistant's response

### Expected Effect

Judges see Claude's reasoning process in real-time — not just a spinner. When they expand any insight card, they see exactly what data points Claude examined. This is the clearest demonstration that the app uses extended thinking meaningfully.

---

## Priority 3: Complete Artifact Generation (+5 pts Demo + Depth)

**Goal:** After a simulation determines a winning scenario, generate real, Claude-powered artifacts (executive memo, Slack message, Jira ticket) instead of falling back to hardcoded templates.

### Currently

- [artifact_generator.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/artifact_generator.py) has a `generate_artifacts` function that calls Claude
- If Claude fails, it falls back to `_generate_fallback_artifacts` which produces template-based output
- The prompt and parsing logic exist but the Claude call may not be reliably producing structured output

### Changes

#### Backend

##### [MODIFY] [artifact_generator.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/artifact_generator.py)

- Fix the Claude prompt to use a more structured approach:
  - Request each artifact as a separate JSON object with `type`, `title`, `content` keys
  - Reduce the number of artifact types generated per call to 3 (executive_summary, slack_update, jira_ticket) to keep output focused
  - Add JSON repair logic (strip markdown fences, handle partial JSON)
- Add explicit examples in the prompt for each artifact format
- Increase `max_tokens` to allow longer, richer artifact content
- Add retry logic (try Claude → if parse fails → retry once with simpler prompt → fallback)

##### [MODIFY] [ArtifactPreview.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/simulation/ArtifactPreview.tsx)

- Ensure each artifact type renders correctly with proper formatting:
  - **Executive Summary:** Rendered as styled markdown with headers, bullet points
  - **Slack Update:** Rendered in a mock Slack message bubble (dark bg, rounded corners, emoji)
  - **Jira Ticket:** Rendered as a structured card with Summary, Description, Acceptance Criteria fields
- Add "Copy to Clipboard" button for each artifact
- Add "Download as PDF" for the executive summary (using browser print-to-PDF)

### Expected Effect

The demo's "gasp moment" — after running a simulation, the user clicks one button and gets a polished executive memo, a ready-to-send Slack message, and a Jira ticket. This is the tangible deliverable judges will remember.

---

## Priority 4: Add Agentic Loop — Claude Self-Corrects or Designs Graph (+7 pts Opus Use)

**Goal:** Add a true multi-step agentic interaction where Claude evaluates its own output and iterates, demonstrating Opus 4.6's reasoning depth beyond single-shot prompts.

### Changes

#### Backend

##### [MODIFY] [agentic_simulation.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/agentic_simulation.py)

Add a **self-critique loop** after the initial 3 scenarios complete:

1. After `asyncio.gather()` returns all 3 scenario results, send the comparison data back to Claude with a new prompt:
   > "Review these 3 simulation results. Are there any flaws in the assumptions? Is there a scenario you missed? If so, suggest ONE additional scenario that would challenge the current winner."
2. If Claude suggests a 4th scenario, run it automatically and update the comparison
3. Yield SSE events: `{"type": "self_critique", "data": {"critique": "...", "suggestion": "..."}}`
4. This creates the visual of Claude "thinking twice" — the dashboard shows the 3 scenarios, then a "Claude is reviewing its analysis..." phase, then potentially a 4th challenger scenario appearing

##### [MODIFY] [AgenticSimulationView.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/simulation/AgenticSimulationView.tsx)

- After initial 3 scenarios appear, show a "Claude is reviewing its analysis..." phase card
- If a 4th scenario is generated, animate it sliding in with a label: "🔄 AI-Generated Counter-Scenario"
- Show Claude's critique text in a collapsible panel

### Expected Effect

This is the "wow" moment for judges evaluating Opus 4.6 usage. Claude doesn't just generate — it **reviews its own work** and sometimes adds a scenario the human didn't think of. This proves agentic reasoning, not just structured output.

---

## Priority 5: Remove or Replace Integrations Page (+3 pts Demo)

**Goal:** The Integrations page is completely static — it shows logos but has zero backend functionality. If a judge clicks it, it damages credibility.

### Changes

#### Option A: Remove entirely (simpler)

##### [MODIFY] [App.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/App.tsx) or router config

- Remove the `/integrations` route

##### [MODIFY] [Header.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/layout/Header.tsx) or navigation

- Remove the "Integrations" nav link

#### Option B: Convert to "Export & Share" (recommended — ties into Priority 3)

##### [MODIFY] [IntegrationsPage.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/pages/IntegrationsPage.tsx)

- Rename to "Export & Share"
- Show generated artifacts from the most recent simulation
- Add "Copy as Slack Block Kit" button (formats insight/artifact as Slack-compatible JSON)
- Add "Copy as Markdown" button
- Keep the integration logos with "Coming Soon" badges (honest about scope)

### Expected Effect

Either removes a credibility risk or transforms it into a natural extension of the artifact pipeline.

---

## Priority 6: Add Loading Skeletons/Shimmer (+2 pts Demo + Depth)

**Goal:** Replace empty states with animated skeleton screens during data loading. Makes the app feel more polished and production-grade.

### Changes

##### [MODIFY] [KPIMetrics.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/dashboard/KPIMetrics.tsx)

- When `isLoading=true`, render 4 skeleton cards with shimmer animation instead of empty space
- Each skeleton card matches the KPI card dimensions

##### [MODIFY] [DashboardPage.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/pages/DashboardPage.tsx)

- When insights are loading, render 6 skeleton insight cards in the masonry grid
- Cards should have varied heights (like real insight cards) for visual realism

##### [MODIFY] Simulation results components

- [FanChart.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/simulation/results/FanChart.tsx), [TornadoChart.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/simulation/results/TornadoChart.tsx), etc.
- Replace Flask icon empty states with chart-shaped skeleton animations

##### [NEW] [SkeletonInsightCard.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/dashboard/SkeletonInsightCard.tsx)

- A shimmer skeleton matching `InsightCard` dimensions: badge placeholder, title line, description lines, impact badges

### Expected Effect

The app never shows blank/empty states during loading — it always looks alive. This is a hallmark of production-quality apps (Stripe, Linear).

---

## Priority 7: Add Second Demo Dataset (+2 pts Impact)

**Goal:** Prove the tool generalizes beyond DevTools SaaS by including a second dataset with a different industry/pattern.

### Changes

##### [NEW] [generate_demo_ecommerce.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/generate_demo_ecommerce.py)

Generate a 150-row e-commerce dataset with different column names and patterns:
- Columns: `store_id`, `store_name`, `plan`, `gmv_monthly`, `signup_date`, `last_order_date`, `orders_30d`, `products_listed`, `churned`, `churn_reason`, `feature_requests`, `support_tickets_30d`, `seller_satisfaction_score`, `region`
- Pattern: "Shipping cost transparency" driving seller churn
- This demonstrates the tool works across industries

##### [MODIFY] [data.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/api/data.py)

Add `/api/data/demo-ecommerce` endpoint

##### [MODIFY] Frontend DataSourcesPage

Add a second demo dataset card: "E-Commerce Marketplace (Demo)"

### Expected Effect

Judges see two completely different datasets producing coherent insights, proving the tool isn't hard-coded for one specific schema.

---

## Priority 8: Switch Simulation Engine to Opus 4.6 (+3 pts Opus Use)

**Goal:** The simulation engine currently uses Sonnet 4.5 (`SIMULATION_MODEL = "claude-sonnet-4-5-20250514"`). Switching to Opus gives richer reasoning in simulations and directly addresses the "Opus 4.6 Use" criteria.

### Changes

##### [MODIFY] [simulation_engine.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/simulation_engine.py)

- Change `SIMULATION_MODEL` to use the Opus model (the default in `claude_client.py`)
- Remove the `model=SIMULATION_MODEL` override in the `run_simulation` call so it defaults to Opus
- Enable thinking for simulations by setting `use_thinking=True`
- Capture and return thinking traces from simulations in the results

##### [MODIFY] [simulation_engine.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/simulation_engine.py) — SSE events

- Yield `{"type": "thinking", "data": {"content": "..."}}` events during simulation so the frontend can show Claude's reasoning about the simulation model

### Expected Effect

Every simulation now uses Opus 4.6 with extended thinking. The reasoning trace shows Claude explaining WHY it chose certain parameter values, making the simulation feel less like a black box.

> [!WARNING]
> This will make simulations slower (~30s → ~60s). Only acceptable if the demo pre-computes simulation results or speeds up the recording.
