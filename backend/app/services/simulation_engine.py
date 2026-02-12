import json
import uuid
from collections.abc import AsyncGenerator
from app.services import claude_client, data_processor
from app.models.database import get_db


SIMULATION_SYSTEM_PROMPT = """You are a senior product strategist and financial modeler. You simulate the business impact of strategic decisions by reasoning through causal chains numerically.

You will receive:
1. A graph of causal nodes (source → modifiers → sinks) with parameter values
2. Optionally, real dataset context for grounding

Your job: reason step-by-step through the causal chain, computing how each modifier transforms the source metrics into the sink outcomes. Use the exact parameter values provided. Show your numerical reasoning.

IMPORTANT: After your reasoning, return a JSON object with EXACTLY these 6 keys. Return ONLY the JSON, no markdown code fences:

{
  "fan_chart": {
    "title": "Projected Revenue Over 12 Months",
    "x_label": "Month",
    "y_label": "Revenue ($)",
    "series": [
      {"id": "p10", "label": "Pessimistic (P10)", "data": [{"x": "M1", "y": number}, ...]},
      {"id": "p50", "label": "Expected (P50)", "data": [{"x": "M1", "y": number}, ...]},
      {"id": "p90", "label": "Optimistic (P90)", "data": [{"x": "M1", "y": number}, ...]},
      {"id": "baseline", "label": "No Change", "data": [{"x": "M1", "y": number}, ...]}
    ]
  },
  "tornado_chart": {
    "title": "Sensitivity Analysis",
    "factors": [
      {"factor": "Parameter Name", "low": number, "high": number, "base": number},
      ...
    ]
  },
  "histogram": {
    "title": "Outcome Distribution (Month 12)",
    "x_label": "Revenue Impact ($)",
    "buckets": [
      {"range": "$0-10K", "count": number},
      ...
    ],
    "percentiles": {"p5": number, "p50": number, "p95": number}
  },
  "scenario_table": {
    "title": "Scenario Comparison",
    "scenarios": [
      {
        "name": "Best Case",
        "revenue_impact": number,
        "customer_impact": number,
        "timeline": "X months",
        "probability": number,
        "key_assumption": "One line"
      },
      {
        "name": "Base Case",
        "revenue_impact": number,
        "customer_impact": number,
        "timeline": "X months",
        "probability": number,
        "key_assumption": "One line"
      },
      {
        "name": "Worst Case",
        "revenue_impact": number,
        "customer_impact": number,
        "timeline": "X months",
        "probability": number,
        "key_assumption": "One line"
      }
    ],
    "recommendation": "best" | "base" | "worst"
  },
  "var_card": {
    "title": "Value at Risk",
    "var_amount": number,
    "var_description": "One-line description of downside risk",
    "confidence_level": 95,
    "expected_value": number,
    "best_case": number,
    "recommendation": "1-2 sentence actionable recommendation"
  },
  "summary": "2-3 sentence executive summary of the simulation results. Be specific with numbers."
}

Rules:
- All monetary values in dollars (no formatting, just numbers)
- Fan chart MUST have exactly 12 monthly data points per series (M1-M12)
- Tornado chart: 4-6 factors, sorted by total swing (high - low) descending
- Histogram: 8-12 buckets covering the outcome range
- Scenario table: exactly 3 rows (Best/Base/Worst)
- VaR: 95% confidence level, var_amount is the maximum expected loss
- Ground numbers in the provided parameters — don't invent unrealistic figures
- Return ONLY the JSON object, no extra text before or after"""


def _build_graph_description(
    template_name: str,
    node_structure: list[dict],
    edge_structure: list[dict],
    node_params: dict[str, dict[str, float]],
) -> str:
    """Build a human-readable description of the simulation graph for Claude."""
    lines = [f"# Simulation: {template_name}\n"]
    lines.append("## Causal Graph Structure\n")

    for node in node_structure:
        node_id = node.get("id", "")
        node_type = node.get("type", "")
        label = node.get("data", {}).get("label", node_id)
        subtitle = node.get("data", {}).get("subtitle", "")

        lines.append(f"### [{node_type.upper()}] {label}")
        if subtitle:
            lines.append(f"  Role: {subtitle}")

        params = node_params.get(node_id, {})
        if params:
            lines.append("  Parameters:")
            for key, value in params.items():
                lines.append(f"    - {key}: {value}")
        lines.append("")

    lines.append("## Causal Connections\n")
    for edge in edge_structure:
        source_id = edge.get("source", "")
        target_id = edge.get("target", "")
        source_label = next(
            (n.get("data", {}).get("label", source_id) for n in node_structure if n.get("id") == source_id),
            source_id,
        )
        target_label = next(
            (n.get("data", {}).get("label", target_id) for n in node_structure if n.get("id") == target_id),
            target_id,
        )
        lines.append(f"  {source_label} → {target_label}")

    return "\n".join(lines)


async def run_simulation(
    template_id: str,
    template_name: str,
    node_params: dict[str, dict[str, float]],
    node_structure: list[dict],
    edge_structure: list[dict],
    dataset_id: str | None = None,
) -> AsyncGenerator[dict, None]:
    """Run a graph-based simulation via Claude. Yields SSE events."""

    simulation_id = str(uuid.uuid4())

    # Step 1: Progress — loading
    yield {"type": "progress", "data": {"step": "Building simulation graph..."}}

    graph_description = _build_graph_description(
        template_name, node_structure, edge_structure, node_params,
    )

    # Step 2: Optional dataset context
    dataset_context = ""
    if dataset_id:
        yield {"type": "progress", "data": {"step": "Loading dataset context..."}}
        try:
            summary = await data_processor.get_dataset_summary(dataset_id)
            if summary["row_count"] > 0:
                dataset_context = f"""

## Real Dataset Context (for grounding)
- Total accounts: {summary['row_count']}
- Columns: {json.dumps([c['name'] for c in summary['columns']])}
- Key stats: {json.dumps(summary['numeric_stats'])}
- Segments: {json.dumps(summary['categorical_counts'])}
"""
        except Exception:
            pass  # Run without dataset context

    # Step 3: Build prompt
    yield {"type": "progress", "data": {"step": "Running simulation with AI..."}}

    user_prompt = f"""Simulate the following strategic scenario. Reason through each node in the causal chain numerically, then produce the 6 required JSON outputs.

{graph_description}
{dataset_context}

Think step-by-step through the causal chain:
1. Start with the source node values
2. Apply each modifier sequentially
3. Compute the final sink outcomes
4. Generate fan chart (12 months), tornado sensitivity, histogram distribution, scenario table, VaR, and summary

Return the JSON object with all 6 keys."""

    # Step 4: Stream Claude response
    full_text = ""
    thinking_buffer = ""
    async for event in claude_client.stream_completion(
        system_prompt=SIMULATION_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        budget_tokens=4000,
    ):
        if event["type"] == "thinking":
            thinking_buffer += event["content"]
            if len(thinking_buffer) > 80:
                yield {"type": "thinking", "data": {"content": thinking_buffer}}
                thinking_buffer = ""
        elif event["type"] == "text":
            full_text += event["content"]

    # Flush remaining thinking
    if thinking_buffer:
        yield {"type": "thinking", "data": {"content": thinking_buffer}}

    # Step 5: Parse results
    yield {"type": "progress", "data": {"step": "Processing simulation results..."}}

    try:
        cleaned = full_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        results = json.loads(cleaned)
    except json.JSONDecodeError:
        yield {"type": "error", "data": {"message": "Failed to parse simulation results from AI"}}
        return

    # Step 6: Yield each result type
    for result_type in ["fan_chart", "tornado_chart", "histogram", "scenario_table", "var_card", "summary"]:
        if result_type in results:
            yield {"type": result_type, "data": results[result_type]}

    # Step 7: Save to DB
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO simulations (id, dataset_id, feature_name, parameters, results, recommendation, confidence, template_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                simulation_id,
                dataset_id or "",
                template_name,
                json.dumps(node_params),
                json.dumps(results),
                results.get("var_card", {}).get("recommendation"),
                results.get("scenario_table", {}).get("scenarios", [{}])[1].get("probability") if len(results.get("scenario_table", {}).get("scenarios", [])) > 1 else None,
                template_id,
            ),
        )
        await db.commit()
    finally:
        await db.close()

    yield {"type": "complete", "data": {"simulation_id": simulation_id}}
