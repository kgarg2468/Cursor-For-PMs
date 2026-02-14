import json
import uuid
from collections.abc import AsyncGenerator
from app.services import claude_client, data_processor
from app.models.database import get_db


CLASSIFY_SYSTEM_PROMPT = """You are an intent classifier for a product intelligence platform. Given a user's natural language command, classify it into exactly one intent.

INTENTS:
1. "navigate" — The user wants to go to a page. Routes: "/" (dashboard/insights), "/simulations" (simulations), "/data" (data sources), "/integrations" (integrations).
2. "quick_answer" — The user wants a quick factual answer about their data (metrics, counts, comparisons). Short answers only — no deep analysis needed.
3. "generate_insight" — The user wants a deep analytical insight: root causes, predictions, detailed analysis of a pattern or problem. Anything that requires examining the data thoroughly.
4. "run_simulation" — The user wants to simulate a what-if scenario, test a hypothesis, or model the impact of a change (pricing, features, campaigns, etc.).

DECISION RULES:
- If the prompt is about navigation ("go to", "show me", "open"), classify as "navigate"
- If the prompt asks a simple question answerable in 1-2 sentences ("what is our churn rate?", "how many users?"), classify as "quick_answer"
- If the prompt asks "why", "what's causing", "analyze", "find patterns", or wants deep understanding, classify as "generate_insight"
- If the prompt contains "what if", "what happens if", "simulate", "model", "impact of", "if we change", classify as "run_simulation"
- When ambiguous between quick_answer and generate_insight, prefer generate_insight if the question requires analysis beyond simple lookups

RESPOND WITH ONLY a JSON object:
{
  "intent": "navigate" | "quick_answer" | "generate_insight" | "run_simulation",
  "confidence": 0.0 to 1.0,
  "route": "/path" (only for navigate intent, null otherwise),
  "refined_prompt": "cleaned up version of the user's question" (null for navigate),
  "focus_area": "specific aspect to focus on" (for generate_insight, null otherwise),
  "simulation_focus": "what to simulate" (for run_simulation, null otherwise)
}

Return ONLY the JSON, no markdown, no code fences."""


SINGLE_INSIGHT_SYSTEM_PROMPT = """You are a senior product analytics AI. You analyze SaaS product data to answer a specific question with a deep, actionable insight.

You will receive a dataset summary and the user's specific question. Produce exactly ONE insight that directly addresses their question.

Categorize the insight as one of:
- "alert": Something urgent needing immediate attention
- "opportunity": A growth or revenue opportunity
- "trend": A notable pattern worth monitoring
- "anomaly": A statistically unusual data point
- "correlation": A meaningful relationship between variables
- "segment": A distinct customer cohort behaving differently
- "feature_adoption": Insights about feature usage patterns
- "revenue_attribution": Which factors drive the most revenue

Assign a priority: "critical", "high", "medium", or "low".

Assign an impact_score from 1 to 100 using:
- Revenue potential (0-30 pts)
- Customer reach (0-25 pts)
- Urgency (0-25 pts)
- Actionability (0-20 pts)

Return a single JSON object (NOT an array) with exactly these fields:
{
  "type": "alert" | "opportunity" | "trend" | "anomaly" | "correlation" | "segment" | "feature_adoption" | "revenue_attribution",
  "priority": "critical" | "high" | "medium" | "low",
  "title": "Short descriptive title (max 60 chars)",
  "description": "One-line summary, max 15 words, no period",
  "prediction": "Predictive headline — what will happen if nothing changes (max 80 chars)",
  "prediction_detail": "2-3 sentences explaining the prediction with evidence",
  "ai_reasoning": "Structured markdown analysis (~150 words) with sections: **Root Cause:** why, **Key Evidence:** 2-3 bullets with numbers, **Recommendations:** 2-3 concrete steps",
  "impact_revenue": <estimated monthly revenue impact as number, or null>,
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

Be specific with numbers from the data. Return ONLY the JSON object, no markdown, no code fences."""


QUICK_ANSWER_SYSTEM_PROMPT = """You are a concise product analytics assistant. Answer the user's question about their SaaS data in 2-4 sentences. Be specific with numbers. If you reference metrics, cite the actual values from the data summary. Do not use markdown headers or bullet points — just a clear, direct answer."""


async def classify_intent(
    prompt: str,
    dataset_id: str | None = None,
    current_route: str | None = None,
) -> dict:
    """Classify user intent using Sonnet (fast, <1s)."""
    context_parts = [f"User prompt: {prompt}"]
    if current_route:
        context_parts.append(f"User is currently on: {current_route}")
    if dataset_id:
        context_parts.append(f"Active dataset: {dataset_id}")

    user_prompt = "\n".join(context_parts)

    raw = await claude_client.complete_no_thinking(
        system_prompt=CLASSIFY_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_tokens=512,
    )

    # Parse JSON response
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback to quick_answer if classification fails
        result = {
            "intent": "quick_answer",
            "confidence": 0.5,
            "route": None,
            "refined_prompt": prompt,
            "focus_area": None,
            "simulation_focus": None,
        }

    return result


async def generate_single_insight(
    prompt: str,
    dataset_id: str,
    focus_area: str | None = None,
) -> AsyncGenerator[dict, None]:
    """Generate a single insight for a specific user question. Yields SSE events."""

    yield {"type": "progress", "data": {"step": "Loading dataset..."}}

    summary = await data_processor.get_dataset_summary(dataset_id)
    if summary["row_count"] == 0:
        yield {"type": "error", "data": {"message": "Dataset is empty"}}
        return

    yield {"type": "progress", "data": {"step": "Analyzing your question..."}}

    focus_context = f"\nFocus area: {focus_area}" if focus_area else ""

    user_prompt = f"""User question: {prompt}{focus_context}

Dataset Overview:
- Total rows: {summary['row_count']}
- Columns: {json.dumps(summary['columns'], indent=2)}

Numeric Statistics:
{json.dumps(summary['numeric_stats'], indent=2)}

Categorical Value Distributions:
{json.dumps(summary['categorical_counts'], indent=2)}

Sample Rows (10 representative records):
{json.dumps(summary['sample_rows'], indent=2)}

Produce exactly ONE insight that directly addresses the user's question. Return as a single JSON object."""

    full_text = ""
    thinking_buffer = ""
    async for event in claude_client.stream_completion(
        system_prompt=SINGLE_INSIGHT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        budget_tokens=2000,
    ):
        if event["type"] == "thinking":
            thinking_buffer += event["content"]
            if len(thinking_buffer) > 80:
                yield {"type": "thinking", "data": {"content": thinking_buffer}}
                thinking_buffer = ""
        elif event["type"] == "text":
            full_text += event["content"]

    if thinking_buffer:
        yield {"type": "thinking", "data": {"content": thinking_buffer}}

    yield {"type": "progress", "data": {"step": "Processing insight..."}}

    # Parse insight
    try:
        cleaned = full_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        item = json.loads(cleaned)
        if isinstance(item, list):
            item = item[0]
    except json.JSONDecodeError:
        yield {"type": "error", "data": {"message": "Failed to parse AI response"}}
        return

    # Save to DB
    insight_id = str(uuid.uuid4())
    chart_data_json = json.dumps(item.get("chart_data")) if item.get("chart_data") else None

    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO insights
               (id, dataset_id, type, priority, title, description,
                impact_revenue, impact_customers, confidence, chart_data,
                ai_reasoning, impact_score, suggested_questions,
                prediction, prediction_detail)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
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
                item.get("ai_reasoning"),
                item.get("impact_score"),
                json.dumps(item.get("suggested_questions", [])),
                item.get("prediction"),
                item.get("prediction_detail"),
            ),
        )
        await db.commit()
    finally:
        await db.close()

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
            "ai_reasoning": item.get("ai_reasoning"),
            "impact_score": item.get("impact_score"),
            "suggested_questions": item.get("suggested_questions", []),
            "prediction": item.get("prediction"),
            "prediction_detail": item.get("prediction_detail"),
            "dismissed": False,
            "created_at": None,
        },
    }

    yield {"type": "complete", "data": {"insight_id": insight_id}}


async def stream_quick_answer(
    prompt: str,
    dataset_id: str | None = None,
) -> AsyncGenerator[dict, None]:
    """Stream a quick concise answer. Yields text_delta + complete events."""

    if not dataset_id:
        yield {"type": "error", "data": {"message": "No active dataset. Please upload or select a dataset first."}}
        return

    summary = await data_processor.get_dataset_summary(dataset_id)
    if summary["row_count"] == 0:
        yield {"type": "error", "data": {"message": "Dataset is empty"}}
        return

    user_prompt = f"""Question: {prompt}

Dataset Overview:
- Total rows: {summary['row_count']}
- Columns: {json.dumps(summary['columns'])}

Numeric Statistics:
{json.dumps(summary['numeric_stats'])}

Categorical Value Distributions:
{json.dumps(summary['categorical_counts'])}"""

    async for event in claude_client.stream_completion(
        system_prompt=QUICK_ANSWER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        model=claude_client.SONNET_MODEL,
        max_tokens=512,
        use_thinking=False,
    ):
        if event["type"] == "text":
            yield {"type": "text_delta", "data": {"content": event["content"]}}

    yield {"type": "complete", "data": {}}
