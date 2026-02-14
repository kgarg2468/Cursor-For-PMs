# Artifact Curation & Generated Artifacts Design

**Date:** 2025-02-13  
**Context:** Agentic simulations currently generate a single set of artifacts (email draft, PDF, Jira, PRD) from the winning scenario. User wants artifacts to be **curatable** and grounded in **simulation results** and **AI insight**.

---

## 1. Purpose & success criteria

- **Purpose:** Turn simulation + insight into multiple, immediately useful artifacts that PMs can pick and refine—not just one generic “plan email.”
- **Curatable:** User can influence which artifacts exist (e.g. choose types, request “one more,” or regenerate with a different audience/focus).
- **Grounded:** Every artifact uses concrete numbers and bullets from the simulation summary and the original insight (title, description, impact).

**Success:** PM sees 3–5 artifact types (e.g. email, one-pager, Jira, PRD, Slack update), each filled with simulation numbers and insight context; PM can request additional types or regenerate with a focus (e.g. “for leadership”).

---

## 2. Artifact ideas (brainstorm)

| Type | Description | When it shines |
|------|-------------|----------------|
| **email** | Win-back / stakeholder email (existing) | Retention; internal alignment |
| **executive_one_pager** | 5–7 bullet one-pager with **Investment**, **Revenue impact**, **Payback**, **Risks** | Leadership / board; fast scan |
| **slack_update** | Short update for #product / #growth with key numbers and CTA | Team broadcast; async alignment |
| **jira_ticket** | Story/ticket with acceptance criteria and simulation-backed rationale | Engineering; feature scenarios |
| **prd** | PRD with problem, goals, success metrics (from simulation) | Feature scenarios; product |
| **pdf** | Proposal deck outline (markdown sections) | Revenue/pricing; sales or exec |
| **meeting_agenda** | 30-min meeting agenda: context, numbers, decision, next steps | Cross-functional kickoff |

**Recommendation:** Generate **executive_one_pager**, **slack_update**, and **email** by default (plus **jira_ticket** / **prd** for feature scenarios). All content must cite simulation summary bullets and insight.

---

## 3. Curation approaches

**Option A – Generate a fixed, rich set**  
- One shot: generate 4–5 artifact types (one-pager, Slack, email, + scenario-specific).  
- **Pro:** Simple, no new UI. **Con:** No user choice.

**Option B – User selects types up front**  
- Before or after comparison: “Generate: [x] One-pager [x] Email [ ] Jira [ ] PRD.”  
- **Pro:** Clear curation. **Con:** Extra step; need UI and API change.

**Option C – Generate default set + “Generate another”**  
- Default set (one-pager, Slack, email, + scenario-specific).  
- “Generate another” dropdown: “Slack update”, “Jira ticket”, “PRD”, “Meeting agenda” → new endpoint generates one more artifact and appends.  
- **Pro:** Curatable without blocking initial flow. **Con:** One extra endpoint and store update.

**Recommendation:** **A + C**. Implement A (richer default set, grounded in summary + insight), then C (“Generate another” by type) so users can curate without changing the initial flow.

---

## 4. Design (implementation outline)

### 4.1 Backend: artifact_generator

- **Inputs:** `insight_id`, winning scenario, **full simulation results** (including **summary** as bullet string), and optional **requested_types** (e.g. `["executive_one_pager", "slack_update", "email"]`).
- **Prompt:**  
  - Include insight (title, description, type, impact).  
  - Include winning scenario (name, description, rationale, template_type).  
  - Include **simulation summary verbatim** (bullet list).  
  - Include key numbers (e.g. from `var_card`, `scenario_table`).  
  - Instruct: “Generate only these types: …” and “Use the exact numbers and bullets from the simulation summary; do not invent figures.”
- **Output:** Same JSON shape; add support for types: `executive_one_pager`, `slack_update`, `meeting_agenda` (plus existing email, pdf, jira_ticket, prd).
- **Default set:** For all scenarios: `executive_one_pager`, `slack_update`, `email`. For feature: also `jira_ticket` and `prd`. For revenue: also `pdf`.

### 4.2 Backend: “Generate another” endpoint

- **POST** `/api/simulations/agentic/{insight_id}/artifacts` with body `{ "type": "jira_ticket" | "prd" | "slack_update" | "meeting_agenda" | ... }`.
- Load last agentic run (scenarios, comparison, winning scenario, existing artifacts).  
- Call `artifact_generator.generate_artifacts(..., requested_types=[type])` to produce a single artifact.  
- Append to `artifacts_json` in DB; return new artifact so frontend can append to list.

### 4.3 Frontend

- **ArtifactPreview:** Support new types (`executive_one_pager`, `slack_update`, `meeting_agenda`) with simple card + copy/download (reuse PRD-style rendering for one-pager/agenda; Slack as pre-wrap).
- **Curation:** In the artifacts section, add “Generate another” with a dropdown of types not already present (or all). On success, append the new artifact to store and UI.

### 4.4 Data flow

- **Initial run:** comparison_ready → generate default set (A) → artifacts_ready.  
- **Curation:** User clicks “Generate another” → choose type → POST → append one artifact → update store and DB.

---

## 5. YAGNI / scope

- **In scope:** Richer default artifacts (one-pager, Slack, email + scenario-specific), grounded in summary + insight; “Generate another” by type; new types in UI.  
- **Out of scope (for now):** “Regenerate with focus” (e.g. audience: leadership vs engineering); filtering or ranking artifacts by relevance; editing artifacts in-app (copy/download is enough).

---

## 6. Slack & Gmail integrations

### 6.1 Placement (where artifacts show up)

- **Same location as current “Generated Artifacts”** — the existing block in `AgenticSimulationView` (`border-t border-border p-6`, below the scenario tabs / results area) is the **Integrations** section.
- No new tab or new panel. That block shows all generated artifacts (Slack, Gmail/email, and any others) with:
  - **Copy** — always available.
  - **Post to Slack** — when Slack is configured; user picks channel (dropdown/modal) then confirms.
  - **Draft in Gmail** — when Gmail is configured; creates draft with subject + body (no recipient required for draft).

### 6.2 Slack behavior

- **Channel picker:** User selects channel (e.g. #product) before posting (dropdown or modal “Post to channel: [pick #channel]” then “Post”).
- **Post** sends the artifact content (Slack message text) to the chosen channel via backend or MCP.

### 6.3 Gmail behavior

- **Draft in Gmail** creates a draft in the connected Gmail account with subject + body parsed from the email artifact. Post/draft options are available for **both** Slack and Gmail artifacts in that same section.

### 6.4 Dedicated Integrations / MCP page

- A **dedicated page** (e.g. `/integrations` or **Integrations** in nav) where users **configure** Slack and Gmail (connect accounts, OAuth, optionally default channel).
- This page is the source of “integration available” — when Slack is connected, “Post to Slack” appears in the artifacts block; when Gmail is connected, “Draft in Gmail” appears.
- MCP servers (or backend proxies to Slack/Gmail APIs) are configured from this page.

### 6.5 Summary

| Item | Choice |
|------|--------|
| Curation | B (filter/rank) + C (refine/redirect) |
| First artifact types | Slack + Gmail (email) |
| Support level | C: Generate + Copy always; Post / Draft when integration configured |
| Slack destination | A: User picks channel (dropdown/modal) |
| Gmail | Draft in Gmail button when configured |
| Where artifacts show | Same DOM as current “Generated Artifacts” block (Integrations under graph) |
| Config | Dedicated Integrations/MCP page for Slack + Gmail |

---

## 7. Files to touch

- `backend/app/services/artifact_generator.py` – prompt, default type set, `requested_types`, new types.  
- `backend/app/api/simulations.py` – POST `agentic/{insight_id}/artifacts`.  
- `frontend/src/components/simulation/ArtifactPreview.tsx` – new types; **Integrations** section in same place as current “Generated Artifacts”; Copy + “Post to Slack” (channel picker) + “Draft in Gmail” when configured.  
- `frontend/src/lib/api.ts` – `postAgenticArtifact(insightId, type)`; endpoints for post-to-Slack, create-Gmail-draft (or call MCP).  
- `frontend/src/stores/simulationStore.ts` – append artifact (e.g. `appendArtifact(artifact)`).  
- **New:** Integrations/MCP page (e.g. `frontend/src/pages/IntegrationsPage.tsx`, route `/integrations`) – configure Slack + Gmail; backend or MCP for OAuth and storing connection state.
