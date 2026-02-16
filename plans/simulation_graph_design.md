# Agentic Simulation & Strategy Engine Design

## Core Concept
**"Don't just show me the data. Tell me what to do."**
Opus doesn't just calculate probabilities; it proactively identifies opportunities, simulates the outcome of intervening, and prepares the execution plan.

## The "Agentic" Workflow
Instead of a user manually building a graph, the system follows this loop:
1.  **Monitor**: "I detected a 15% drop in activation for invited users."
2.  **Simulate**: "I ran 3 scenarios. The best path is a 'Welcome Concierge' email campaign."
3.  **Propose**: "Here is the projected impact (+$12k MRR) and the draft email copy."
4.  **Execute**: "Shall I schedule the A/B test?"

## Interface: The "Impact Story" Definition

### 1. The Trigger (The "Why")
*   **Source**: An anomaly or trend from the Insight Engine.
*   **Presentation**: "High Churn Risk Detected in Enterprise Segment."
*   **Action**: "View Strategic Options" (leads to Simulation).

### 2. The Simulation Workspace (The "What-If")
*   **Standard View**: Side-by-side comparison of **"Status Quo"** (Do Nothing) vs **"Opus Strategy"** (Intervention).
*   **Visuals**:
    *   **The "Impact Gap"**: A shaded area between the two curves showing net benefit (e.g., "Saved Revenue").
    *   **Confidence Intervals**: Show risk/reward clearly.

### 3. The Action Plan (The "How")
*   **Auto-Drafted Artifacts**: The simulation output includes ready-to-use materials.
*   **Examples**:
    *   *Churn Strategy*: Drafts a "We Miss You" email campaign or a specialized discount offer.
    *   *Pricing Opportunity*: Drafts a PDF "New Pricing Model" proposal for the executive team.
    *   *Feature Gap*: Drafts a Jira Ticket / PRD for the missing feature.

## Simulation Scenarios (Hackathon Demo Focus)

### Scenario A: The "Churn Crusher" (Retention)
*   **Trigger**: "Churn predicted to rise to 8% next month due to competitor launch."
*   **Opus Action**: "Simulate 'Usage-Based Pricing' vs 'Loyalty Lock-in' contracts."
*   **Winning Strategy**: 'Loyalty Lock-in' (Discounts for annual commitment).
*   **Output**:
    *   **Graph**: Shows churn dropping to 3% and LTV increasing.
    *   **Artifact**: Drafts the "Exclusive Annual Upgrade Offer" email to top 50 at-risk accounts.

### Scenario B: The "Pricing Prime" (Revenue Optimization)
*   **Trigger**: "Top 10% of users are hitting usage caps frequently. They have high willingness to pay."
*   **Opus Action**: "Simulate introducing a 'Pro+' tier at $99/mo."
*   **Output**:
    *   **Graph**: Revenue jumps 20% with minimal churn.
    *   **Artifact**: A "Pricing Strategy Memo" (PDF) outlining the tier features and projected uptake.

### Scenario C: The "Feature Scaler" (Growth)
*   **Trigger**: "Search queries for 'API Access' are up 400%."
*   **Opus Action**: "Simulate building a Public API feature."
*   **Output**:
    *   **Graph**: Shows acquisition curve steepening (Developer-led growth).
    *   **Artifact**: A "PRD: Public Client API" outlining endpoints and use cases.

## Technical Components

1.  **Scenario Generator**:
    *   Input: Insight JSON + Market Context.
    *   Output: 3 distinct Simulation Graphs (NetworkX / React Flow definitions).

2.  **Impact Calculator**:
    *   Logic: Runs Monte Carlo on "Status Quo" vs "Strategy A/B/C".
    *   Metric: "Net Present Value (NPV)" of the intervention.

3.  **Artifact Generator**:
    *   Uses Claude to generate high-fidelity text/code assets (Emails, PDFs, JSON tickets).

4.  **The "Driver" (Agent)**:
    *   Orchestrates the flow. It doesn't wait for "Run Simulation". It runs them in the background and presents the *winner*.

## User Experience Goal
The user feels like they have a **Chief Strategy Officer** in a box. The system does the math, writes the plan, and just asks for a signature.

---

# Implementation Plan - Agentic Simulation Workflow

## Goal Description
Transform the current "Market Simulation" feature from a passive graphing tool into a proactive **Agentic Strategy Engine**. 
The system will:
1.  **Proactively Trigger** simulations based on insights (e.g., "Churn Risk Detected").
2.  **Tell an Impact Story** by comparing "Status Quo" vs "Opus Strategy" side-by-side.
3.  **Generate Actionable Artifacts** (Draft Emails, PRDs, Jira Tickets) to close the loop.

## User Review Required
> [!IMPORTANT]
> This is a pivot from the original "Design Your Own Graph" model. The graph editor will still exist but will be secondary to the "Auto-Generated Strategy" view.

## Proposed Changes

### Frontend (`frontend/src/features/simulation/`)

#### [NEW] `components/AgenticTriggerCard.tsx`
- A card that appears on the Dashboard or Insight Panel.
- Displays the "Trigger" (e.g., "High Churn Risk") and a primary action button: "View Strategic Options".

#### [NEW] `components/SimulationComparisonView.tsx`
- **Split Layout**:
    - **Left**: "Status Quo" (Baseline projection).
    - **Right**: "Opus Strategy" (Intervention projection).
- **Visuals**:
    - `Recharts` area chart with a "Gain/Loss" shaded region.
    - Key metrics diff (e.g., "+$12k MRR", "-5% Churn").

#### [NEW] `components/ArtifactPreview.tsx`
- A file previewer for the auto-generated assets.
- Supports:
    - **Email**: Simple rich text view.
    - **PDF/Doc**: Preview card with download button.
    - **Ticket**: Jira-like card layout.

#### [MODIFY] `pages/SimulationPage.tsx`
- Update to support the new "Agentic Mode" state.
- If triggered by an insight, show the `SimulationComparisonView` instead of the empty Graph Editor.

### Backend (`backend/app/services/`)

#### [MODIFY] `simulation_engine.py`
- Add `run_agentic_simulation(insight_context)` method.
- Logic:
    1.  Select appropriate template based on insight type.
    2.  Run baseline simulation.
    3.  Run intervention simulation.
    4.  Return comparison data.

#### [NEW] `artifact_generator.py`
- Service to generate the "Action Plan" assets.
- Uses Claude to draft high-quality text content based on the simulation context.
- Output: Structured JSON (type, content, title).

## Verification Plan

### Manual Verification
1.  **Trigger Flow**:
    - Navigate to Dashboard.
    - Click "View Options" on a mock Churn Insight.
    - Verify redirection to Simulation Page in "Comparison Mode".
2.  **Visual Accuracy**:
    - Check that the "Status Quo" vs "Opus Strategy" charts render correctly.
    - Verify the "Impact Gap" is visible and makes sense.
3.  **Artifact Generation**:
    - Click "Draft Campaign".
    - Verify an email draft appears with relevant context from the simulation.
