import json
import uuid
from collections.abc import AsyncGenerator
from app.services import claude_client, data_processor
from app.models.database import get_db


SYSTEM_PROMPT = """You are a senior product analytics AI. You autonomously analyze SaaS product data and discover actionable business insights.

You will receive a dataset summary with statistics and sample rows. Your job is to find 5-8 of the most impactful insights in the data.

AUTONOMOUS DISCOVERY: You decide which dimensions to analyze. Look across all available columns — cross-reference segments, time periods, features, plans, and behaviors. Surprise the PM with insights they wouldn't have thought to look for.

For each insight, categorize it as one of:
- "alert": Something urgent that needs immediate attention (churn spikes, declining metrics)
- "opportunity": A growth or revenue opportunity the team is missing
- "trend": A notable pattern or trend worth monitoring over time
- "anomaly": A statistically unusual data point or outlier that deviates from expected patterns
- "correlation": A meaningful relationship between two or more variables
- "segment": A distinct customer cohort behaving differently from the average
- "feature_adoption": Insights about how features are being adopted, underused, or abandoned
- "revenue_attribution": Which factors (features, plans, segments) drive the most revenue

Assign a priority: "critical", "high", "medium", or "low".

Assign an impact_score from 1 to 100 using this composite scoring:
- Revenue potential (0-30 pts): How much money is at stake?
- Customer reach (0-25 pts): How many customers are affected?
- Urgency (0-25 pts): How time-sensitive is this insight?
- Actionability (0-20 pts): How easy is it to act on?

IMPORTANT: Return your analysis as a JSON array sorted by impact_score descending. Each element must have exactly these fields:
{
  "type": "alert" | "opportunity" | "trend" | "anomaly" | "correlation" | "segment" | "feature_adoption" | "revenue_attribution",
  "priority": "critical" | "high" | "medium" | "low",
  "title": "Short descriptive title (max 60 chars)",
  "description": "One-line summary, max 15 words, no period (like a news headline)",
  "impact_revenue": <estimated monthly revenue impact as a number (positive = opportunity, negative = risk), or null>,
  "impact_customers": <number of customers affected, or null>,
  "confidence": <0.0 to 1.0>,
  "impact_score": <1 to 100>,
  "chart_data": {
    "type": "bar" | "line",
    "labels": ["Label1", "Label2", ...],
    "values": [number1, number2, ...]
  },
  "suggested_questions": ["Question 1?", "Question 2?"]
}

Focus on:
1. Churn patterns and at-risk segments
2. Revenue opportunities (upsell, conversion optimization)
3. Usage anomalies and statistical outliers
4. Feature adoption patterns and underused features
5. Customer segment behavior differences
6. Correlations between metrics (e.g., support tickets vs churn)
7. Revenue attribution across plans, features, and cohorts
8. Cross-dimensional patterns (e.g., segment × feature × time)

Quantify the business impact wherever possible. Be specific with numbers from the data. Aim for diversity in insight types — do NOT return all the same type.

Return ONLY the JSON array, no markdown formatting, no code blocks, no extra text."""


EXPAND_SYSTEM_PROMPT = """You are a senior product analytics AI. Given an insight summary and dataset context, produce a detailed analysis in markdown.

Structure your response with these sections:
## Root Cause Analysis
Why this is happening — identify underlying drivers from the data.

## Key Data Points
Bullet list of the most important numbers and evidence.

## Recommendations
Concrete next steps the product/growth team should take.

## Risks & Considerations
What could go wrong, caveats, and things to watch.

Keep the total response between 200-400 words. Be specific and actionable. Use numbers from the data wherever possible. Return ONLY the markdown, no code fences."""


async def generate_expanded_reasoning(insight_row: dict, dataset_id: str) -> str:
    """Generate detailed AI reasoning for a single insight."""
    try:
        summary = await data_processor.get_dataset_summary(dataset_id)

        user_prompt = f"""Provide a detailed analysis for this insight:

Title: {insight_row['title']}
Type: {insight_row['type']}
Priority: {insight_row['priority']}
Description: {insight_row['description']}
Revenue Impact: {insight_row.get('impact_revenue', 'N/A')}
Customers Affected: {insight_row.get('impact_customers', 'N/A')}
Confidence: {insight_row.get('confidence', 'N/A')}

Dataset context:
- Total rows: {summary['row_count']}
- Columns: {json.dumps(summary['columns'])}
- Numeric stats: {json.dumps(summary['numeric_stats'])}
- Category distributions: {json.dumps(summary['categorical_counts'])}"""

        result = await claude_client.complete(
            system_prompt=EXPAND_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            budget_tokens=1024,
        )
        return result["text"]
    except Exception as e:
        return (
            f"## Analysis Unavailable\n\n"
            f"Unable to generate detailed analysis at this time.\n\n"
            f"**Error:** {str(e)}\n\n"
            f"Try again later or check that your API key is configured."
        )


async def generate_insights(dataset_id: str) -> AsyncGenerator[dict, None]:
    """Orchestrate AI insight generation. Yields SSE-ready event dicts."""

    # Step 1: Loading
    yield {"type": "progress", "data": {"step": "Loading dataset..."}}

    summary = await data_processor.get_dataset_summary(dataset_id)
    if summary["row_count"] == 0:
        yield {"type": "error", "data": {"message": "Dataset is empty"}}
        return

    # Step 2: KPIs
    yield {"type": "progress", "data": {"step": "Computing key metrics..."}}
    kpis = await data_processor.compute_kpis(dataset_id)
    yield {"type": "kpis", "data": kpis}

    # Step 3: Prepare Claude prompt
    yield {"type": "progress", "data": {"step": "Analyzing data patterns with AI..."}}

    user_prompt = f"""Analyze this SaaS product dataset and find 5-8 key insights. Look across ALL dimensions — cross-reference segments, plans, features, and time periods to find non-obvious patterns.

Dataset Overview:
- Total rows: {summary['row_count']}
- Columns: {json.dumps(summary['columns'], indent=2)}

Numeric Statistics:
{json.dumps(summary['numeric_stats'], indent=2)}

Categorical Value Distributions:
{json.dumps(summary['categorical_counts'], indent=2)}

Sample Rows (10 representative records):
{json.dumps(summary['sample_rows'], indent=2)}

Find the most impactful insights — anomalies, correlations, segment behaviors, feature adoption gaps, revenue attribution, churn risks, and growth opportunities. Use diverse insight types. Return as a JSON array sorted by impact_score descending."""

    # Step 4: Stream Claude response
    full_text = ""
    thinking_buffer = ""
    async for event in claude_client.stream_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        budget_tokens=2000,
    ):
        if event["type"] == "thinking":
            thinking_buffer += event["content"]
            # Yield thinking in chunks for UI updates
            if len(thinking_buffer) > 80:
                yield {"type": "thinking", "data": {"content": thinking_buffer}}
                thinking_buffer = ""
        elif event["type"] == "text":
            full_text += event["content"]

    # Flush remaining thinking
    if thinking_buffer:
        yield {"type": "thinking", "data": {"content": thinking_buffer}}

    # Step 5: Parse insights from Claude's response
    yield {"type": "progress", "data": {"step": "Processing insights..."}}

    try:
        # Strip any markdown code fences if present
        cleaned = full_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        insights_data = json.loads(cleaned)
        if not isinstance(insights_data, list):
            insights_data = [insights_data]
    except json.JSONDecodeError:
        yield {"type": "error", "data": {"message": "Failed to parse AI response"}}
        return

    # Step 6: Save insights to DB and yield them
    db = await get_db()
    try:
        for item in insights_data:
            insight_id = str(uuid.uuid4())
            chart_data_json = json.dumps(item.get("chart_data")) if item.get("chart_data") else None

            await db.execute(
                """INSERT INTO insights
                   (id, dataset_id, type, priority, title, description,
                    impact_revenue, impact_customers, confidence, chart_data,
                    ai_reasoning, impact_score, suggested_questions)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    insight_id,
                    dataset_id,
                    item.get("type", "trend"),
                    item.get("priority", "medium"),
                    item.get("title", "Untitled Insight"),
                    item.get("description", ""),
                    item.get("impact_revenue"),
                    item.get("impact_customers"),
                    item.get("confidence"),
                    chart_data_json,
                    None,
                    item.get("impact_score"),
                    json.dumps(item.get("suggested_questions", [])),
                ),
            )

            yield {
                "type": "insight",
                "data": {
                    "id": insight_id,
                    "dataset_id": dataset_id,
                    "type": item.get("type", "trend"),
                    "priority": item.get("priority", "medium"),
                    "title": item.get("title", "Untitled Insight"),
                    "description": item.get("description", ""),
                    "impact_revenue": item.get("impact_revenue"),
                    "impact_customers": item.get("impact_customers"),
                    "confidence": item.get("confidence"),
                    "chart_data": item.get("chart_data"),
                    "ai_reasoning": None,
                    "impact_score": item.get("impact_score"),
                    "suggested_questions": item.get("suggested_questions", []),
                    "dismissed": False,
                    "created_at": None,
                },
            }

        await db.commit()
    finally:
        await db.close()

    yield {"type": "complete", "data": {"count": len(insights_data)}}
