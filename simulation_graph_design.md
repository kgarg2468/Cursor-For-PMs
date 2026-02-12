# Market Graph Simulation Design

## Core Concept
"But for Market Logic."
A visual, node-based editor where PMs map out market dynamics. Instead of a static form, they build a flow of cause-and-effect.

## The Interface
-   **Canvas**: Infinite grid (React Flow / XYFlow).
-   **Sidebar**: Draggable nodes (Features, Events, Metrics).
-   **Context Chat**: Sidebar AI that can build the graph for you ("Simulate a 20% price drop" -> AI auto-generates the nodes).
-   **Bottom/Overlay**: The "Result Dashboard" (Time-series charts) updates in real-time as nodes are connected.

## Node Interaction Model

### 1. The "Inspector" Modal
Clicking any node opens a detailed **Inspector Modal**.
*   **Purpose**: precise configuration and data validation.
*   **States**:
    *   **Auto-Filled**: Data extracted from documents (Green indicator). *Editable*.
    *   **Missing/Required**: Data not found (Red border/Text). *User must input*.
    *   **Manual**: User pinned value.

### 2. Smart Extraction Logic
When a node is added (e.g., "Competitor Node"):
1.  System scans uploaded documents/RAG context.
2.  **If Found**: Pre-fills fields (e.g., "Competitor Name: Salesforce", "Market Share: 20%").
3.  **If Ambiguous**: Suggests range (e.g., "Market Share: 15-25% based on Q3 report").
4.  **If Missing**: Highlights field in Red ("Please enter Competitor Growth Rate").

## Node Ecosystem

### 1. Source Nodes (The "Inputs")
*   **Existing Product**: 
    *   *Modal Prompts*: "Which product?", "Current ARR?", "Churn Rate?".
    *   *Auto-Fill*: Pulls from internal DB/Uploaded P&L.
*   **Market Segment**: Represents a target audience.
    *   *Params*: Size (SAM/TAM), Growth Rate, Budget/Willingness to Pay.
*   **Competitor**: A hostile entity stealing market share.
    *   *Params*: Aggressiveness, Feature Parity.

### 2. Modifier Nodes (The "What-Ifs")
*   **Feature Launch**:
    *   *Impact*: +Acquisition, +Retention, +Dev Cost.
*   **Pricing Change**:
    *   *Impact*: -Conversion (usually), +Revenue per User.
*   **Marketing Campaign**:
    *   *Impact*: +Traffic, +CAC.
*   **External Event**: (e.g., "Competitor goes bankrupt", "Economic downturn").

### 3. Logic Nodes
*   **Splitter**: A/B test simulation.
*   **Delay**: "Feature launches in Q3".

### 4. Sink/Metric Nodes (The "Outputs")
*   **Revenue (ARR/MRR)**.
*   **User Base (DAU/MAU)**.
*   **Sentiment/NPS**.

## Simulation Logic (The "Engine")
How do we turn a graph into a Monte Carlo simulation?
1.  **Traversal**: The graph is a DAG (Directed Acyclic Graph).
2.  **Time-Step Execution**: We run the graph for `T` months (e.g., 24 months).
3.  **Monte Carlo**: For each node with uncertainty (e.g., "Feature impact is 5-15%"), we run 1000+ passes sampling from that distribution.
4.  **Aggregation**: The "Result Dashboard" aggregates the 1000 runs into P50/P90 confidence intervals.

## Enterprise-Grade Simulation Outputs
The "Results Dashboard" will feature standard financial modeling outputs:
1.  **Forecast Fan Charts**: Time-series with P10/P50/P90 confidence intervals (The "Trumpet of Doom" or "Cone of Uncertainty").
2.  **Tornado Charts (Sensitivity Analysis)**: "Which variable matters most?" (e.g., Shows that *Churn Rate* variance impacts revenue 3x more than *Ad Spend*).
3.  **Histogram of Outcomes**: "What are the odds?" (e.g., X-axis = ARR, Y-axis = Probability). Shows the "Fat Tails" of risk.
4.  **Scenario Comparison Table**: 
    *   Diffs for Key Metrics (Revenue, Profit, CAC).
    *   "Win Probability" (Likelihood of beating the baseline).
5.  **Value at Risk (VaR)**: "In the worst 5% of cases, how much do we lose?"

## Demo Templates (For "Wow" Factor)

These 3 scenarios are pre-loaded to demonstrate the engine's power using typical "Developer Tools SaaS" data (~500 accounts).

### 1. The "SSO Tax" Strategy (Monetization Gate)
*   **The Problem**: "We have 50 enterprise users on the $20 Pro plan. We want to force them to the $500 Enterprise plan by gating SSO."
*   **The Graph**:
    *   `[Source: Current Users]` -> `[Action: Gate SSO Feature]` -> `[Splitter: Churn vs Upgrade]` -> `[Metric: Revenue Lift]`
*   **The Visualization**:
    *   Shows huge drop in User Count (Churn of angry pros).
    *   Shows massive jump in ARR (Upgrades).
    *   **Tornado Chart**: Highlights "Enterprise Conversion Rate" as the critical success variable.

### 2. The "Usage-Based Pivot" (Business Model Shift)
*   **The Problem**: "Our flat $20/seat pricing is leaving money on the table for power users. What if we charge $0.01 per API call?"
*   **The Graph**:
    *   `[Source: Log Data]` -> `[Transform: API Volume Distribution]` -> `[Action: Pricing Change]` -> `[Metric: Revenue Volatility]`
*   **The Visualization**:
    *   **Fan Chart**: Shows much wider confidence intervals (Revenue becomes volatile but potentially higher).
    *   **Histogram**: "Fat Tail" upside (Chance of 3x revenue).

### 3. The "Viral Loop" Injection (Growth Hack)
*   **The Problem**: "Growth is linear. We want exponential. Let's add a 'Powered By' badge to the free tier."
*   **The Graph**:
    *   `[Source: Traffic]` -> `[Action: Add Viral Badge]` -> `[Logic: Viral Coefficient (K-factor) > 1.0]` -> `[Metric: Exponential Acquisition]`
*   **The Visualization**:
    *   Shows the "Hockey Stick" curve.
    *   Comparing "Linear Ad Spend" vs "Viral Growth" cost savings.
