import json
import uuid
from collections.abc import AsyncGenerator
from app.services import claude_client, data_processor
from app.models.database import get_db


SYSTEM_PROMPT = """You are a senior product analytics AI. You analyze SaaS product data and discover actionable business insights.

You will receive a dataset summary with statistics and sample rows. Your job is to find 3-5 of the most impactful insights in the data.

For each insight, categorize it as one of:
- "alert": Something urgent that needs attention (churn spikes, anomalies, declining metrics)
- "opportunity": A growth or revenue opportunity the team is missing
- "trend": A notable pattern or trend worth monitoring

Assign a priority: "critical", "high", "medium", or "low".

IMPORTANT: Return your analysis as a JSON array. Each element must have exactly these fields:
{
  "type": "alert" | "opportunity" | "trend",
  "priority": "critical" | "high" | "medium" | "low",
  "title": "Short descriptive title (max 60 chars)",
  "description": "2-3 sentence explanation of the insight and why it matters",
  "impact_revenue": <estimated monthly revenue impact as a number (positive = opportunity, negative = risk), or null>,
  "impact_customers": <number of customers affected, or null>,
  "confidence": <0.0 to 1.0>,
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
3. Usage anomalies and trends
4. Feature adoption patterns
5. Customer segment behavior differences

Quantify the business impact wherever possible. Be specific with numbers from the data.

Return ONLY the JSON array, no markdown formatting, no code blocks, no extra text."""


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

    user_prompt = f"""Analyze this SaaS product dataset and find 3-5 key insights.

Dataset Overview:
- Total rows: {summary['row_count']}
- Columns: {json.dumps(summary['columns'], indent=2)}

Numeric Statistics:
{json.dumps(summary['numeric_stats'], indent=2)}

Categorical Value Distributions:
{json.dumps(summary['categorical_counts'], indent=2)}

Sample Rows (10 representative records):
{json.dumps(summary['sample_rows'], indent=2)}

Find the most impactful insights — anomalies, churn risks, revenue opportunities, and notable trends. Return as a JSON array."""

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
                    impact_revenue, impact_customers, confidence, chart_data, ai_reasoning)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
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
                    "dismissed": False,
                    "created_at": None,
                    "suggested_questions": item.get("suggested_questions", []),
                },
            }

        await db.commit()
    finally:
        await db.close()

    yield {"type": "complete", "data": {"count": len(insights_data)}}
