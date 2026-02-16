# Demo Guide — Product Insight Autopilot

## The Narrative

You are **Sarah Chen, VP of Product** at a mid-stage developer tools SaaS company (~500 accounts, $4M ARR). Your board meeting is in **48 hours**. The central strategic question:

> "Should we double down on **enterprise sales** (bigger contracts, longer cycles, custom features) or invest in **self-serve PLG growth** (freemium expansion, activation optimization, virality loops)?"

You have raw product data but no time to crunch it manually. You need Claude to analyze your data, surface the risks you're not seeing, and simulate both strategies so you can walk into the board meeting with a data-backed recommendation.

---

## Walkthrough

### Step 1: Load the Dataset

1. Navigate to **Data Sources** (`/data`)
2. Click **"Try Sample Data"** — this loads the demo dataset (developer tools SaaS, ~500 accounts)
3. You'll see the dataset summary with account-level metrics: MRR, usage, churn risk, NPS, plan tier, etc.

### Step 2: Generate Insights (Dashboard)

1. Navigate to **Dashboard** (`/`)
2. Insights generate automatically. Watch Claude's reasoning panel (brain icon, left sidebar) — you'll see the multi-step activity feed:
   - Analyzing dataset structure
   - Computing KPIs
   - Identifying patterns, anomalies, correlations
   - Generating each insight card
3. Once complete, you'll see **5-8 insight cards** organized by type (alerts, opportunities, trends, segments)
4. The reasoning feed collapses into a "Claude's reasoning (N steps)" card you can expand anytime

**Key insights to highlight:**
- Enterprise segment churn risk (alert)
- Self-serve activation opportunity (opportunity)
- Revenue concentration in top accounts (trend)

### Step 3: Explore an Insight — Action Items

1. Click on the **enterprise churn risk** insight card
2. The insight wizard opens. Navigate to **Step 3: Actions**
3. Watch the rich activity feed:
   - "Loading context" (Search icon) — retrieves insight + dataset context
   - "Reasoning through actions" (Brain icon) — Claude's extended thinking
   - "Building action items" (Sparkles icon) — each action appears as a sub-task
4. Review the generated actions (e.g., "Launch enterprise health score dashboard", "Implement proactive renewal outreach")
5. Click **"Add All to Action Plan"** to save them

### Step 4: Trigger Strategic Simulation

1. From the insight card or the action items step, click **"Run Strategic Simulation"**
2. This navigates to the **Simulations** page in agentic mode
3. Watch the agentic activity feed:
   - Claude generates **3 strategic scenarios** from the insight
   - Each scenario gets its own simulation graph with tailored parameters
   - Results are compared across scenarios
4. The winning scenario gets a trophy icon

### Step 5: Explore Simulation Results

1. Click between scenario tabs to see different strategic approaches
2. Switch to **Results** tab to see:
   - **Fan chart** — revenue projections with confidence intervals
   - **Tornado chart** — sensitivity analysis (which levers matter most)
   - **Histogram** — outcome distribution
   - **Scenario table** — key metrics across time periods
   - **VaR card** — downside risk quantification
3. The reasoning feed persists above the charts — collapse/expand it to review Claude's logic

### Step 6: Node Conversations (Deep Dive)

1. Switch to the **Graph** tab
2. Click on a node, e.g., **"Conversion Rate"**
3. In the Node Inspector panel, use the chat to ask Claude contextual questions:

**Prompt for Conversion Rate node:**
> "Our current trial-to-paid conversion is 12%. Given that we just launched interactive tutorials and our activation rate improved from 34% to 41% last quarter, what conversion rate should we target for this simulation? Consider that competitors in dev tools typically see 15-20% conversion with good onboarding."

**Prompt for Enterprise Revenue node:**
> "We have 23 enterprise accounts averaging $14K MRR each. Our pipeline has 8 qualified enterprise leads with average deal size of $18K MRR. Historically our enterprise close rate is 35% with 90-day cycles. Adjust the enterprise revenue parameters to reflect a scenario where we add a dedicated enterprise sales team."

4. Claude will suggest specific parameter adjustments based on the context
5. Adjust the node sliders based on Claude's recommendations

### Step 7: Re-run and Compare

1. After adjusting parameters, click **"Run Simulation"** again
2. Compare the new results with the previous run
3. Switch to the **Results** tab — the updated charts reflect your parameter changes

### Step 8: Review Action Plan

1. Navigate back to **Dashboard**
2. Switch to the **Action Plan** tab
3. Review all saved action items across insights
4. These are the concrete next steps you'd present to the board

---

## Copilot Prompt (Side Panel)

Open the side panel (chat icon or `Cmd+K` → "Chat") and try this prompt:

> "I'm preparing for a board meeting in 48 hours. Based on the data you've analyzed, give me a concise brief on: (1) our biggest revenue risk in the next 90 days, (2) the highest-ROI growth lever we're under-investing in, and (3) whether we should prioritize enterprise expansion or self-serve PLG for the next quarter. Be specific with numbers from the data."

**Pro tip:** Pin 2-3 relevant insight cards before sending this message. The pinned context gives Claude specific data points to reference in its response.

---

## Key Demo Talking Points

1. **"Cursor for PMs"** — just like Cursor helps engineers write better code faster, this helps PMs make better product decisions faster
2. **Everything streams** — no waiting for batch jobs. Insights, simulations, and chat all stream in real-time with visible reasoning
3. **Reasoning is transparent** — the thinking panel shows Claude's actual reasoning process, not just final outputs. You can audit every step
4. **Contextual AI** — node conversations let you inject domain knowledge (pipeline data, competitive intel, internal metrics) that Claude can't know from the dataset alone
5. **End-to-end workflow** — data → insights → simulations → action plan. One tool replaces the analyst + spreadsheet + slide deck loop
6. **Agentic simulation** — Claude doesn't just run one scenario, it generates multiple strategic alternatives, runs them all, compares outcomes, and recommends the best path

---

## Troubleshooting

- **Insights not generating?** Make sure you've loaded a dataset first (Data Sources → Try Sample Data)
- **Simulation stuck?** Check that the backend is running (`cd backend && uvicorn app.main:app --reload --port 8000`)
- **API key errors?** Ensure `ANTHROPIC_API_KEY` is set in `backend/.env`
- **Empty reasoning panel?** Click the brain icon in the header to toggle the ThinkingPanel. It shows reasoning from the most recent AI operation
