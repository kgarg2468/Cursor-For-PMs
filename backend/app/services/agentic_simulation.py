import json
import uuid
import asyncio
from collections.abc import AsyncGenerator
from typing import Dict, List, Any
from app.services import claude_client, data_processor, simulation_engine
from app.models.database import get_db


SCENARIO_GENERATION_PROMPT = """You are a product strategist. Given an insight about a product/business issue, generate 3 distinct strategic intervention scenarios.

Each scenario should:
1. Address the root cause identified in the insight
2. Be implementable within 3-6 months
3. Have measurable business impact (revenue, churn, growth)
4. Be distinct from the other scenarios (different approaches)

Return a JSON array with exactly 3 scenarios. Each scenario must have:
{
  "id": "scenario-1",
  "name": "Short descriptive name (max 40 chars)",
  "description": "2-3 sentence explanation of the strategy",
  "template_type": "retention" | "revenue" | "feature",
  "node_structure": [
    {
      "id": "node-id",
      "type": "source" | "modifier" | "sink",
      "position": {"x": number, "y": number},
      "data": {
        "label": "Node Label",
        "subtitle": "Brief description",
        "icon": "IconName",
        "params": [
          {
            "key": "param_key_snake_case",
            "label": "Human-readable label",
            "type": "currency" | "percentage" | "slider" | "number" | "months",
            "default": number,
            "min": number,
            "max": number,
            "step": number
          }
        ]
      }
    },
    ...
  ],
  "edge_structure": [
    {"id": "edge-id", "source": "source-node-id", "target": "target-node-id"},
    ...
  ],
  "node_params": {
    "node-id": {
      "param_key": value (number, must match keys in data.params)
    }
  },
  "rationale": "Why this strategy addresses the insight"
}

Template types guide:
- "retention": Focus on reducing churn, improving retention (discounts, loyalty programs, feature improvements)
- "revenue": Focus on increasing revenue (pricing changes, upsells, new tiers)
- "feature": Focus on product investments (new features, integrations, capabilities)

Param types: "currency" (dollars), "percentage" (0-100), "slider" (numeric scale), "number" (integer or float), "months" (time horizon).
- source nodes: typically have baseline params (mrr, churn_rate, seat_price, etc.) with sensible min/max/step.
- modifier nodes: have intervention params (discount_pct, conversion_rate, etc.).
- sink nodes: leave "params" as empty array [].

Vary graph structure: each scenario can have 3 to 8+ nodes and different topologies (linear, diamond, multi-branch). Use position x,y to lay out left-to-right (e.g. source ~50-100, modifiers ~300-400, sink ~600-700). Ensure node_params keys match the "key" field in each node's data.params; default values should match data.params[].default.
Return ONLY the JSON array, no markdown, no code fences."""


async def generate_scenarios(insight_id: str) -> List[Dict[str, Any]]:
    """Generate 3 strategic scenarios based on an insight (non-streaming)."""
    scenarios: List[Dict[str, Any]] = []
    async for event in generate_scenarios_stream(insight_id):
        if event["type"] == "scenarios_result":
            scenarios = event["data"]["scenarios"]
    return scenarios


async def generate_scenarios_stream(insight_id: str) -> AsyncGenerator[Dict[str, Any], None]:
    """Generate 3 strategic scenarios, yielding thinking events as they arrive."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, dataset_id, type, priority, title, description,
                      impact_revenue, impact_customers, confidence,
                      prediction, prediction_detail, ai_reasoning
               FROM insights WHERE id = ?""",
            (insight_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise ValueError(f"Insight {insight_id} not found")

        dataset_id = row[1]
        insight_data = {
            "type": row[2],
            "priority": row[3],
            "title": row[4],
            "description": row[5],
            "impact_revenue": row[6],
            "impact_customers": row[7],
            "confidence": row[8],
            "prediction": row[9],
            "prediction_detail": row[10],
            "ai_reasoning": row[11],
        }
    finally:
        await db.close()

    # Get dataset context
    dataset_context = ""
    try:
        summary = await data_processor.get_dataset_summary(dataset_id)
        if summary["row_count"] > 0:
            dataset_context = f"""
## Dataset Context
- Total accounts: {summary['row_count']}
- Key stats: {json.dumps(summary['numeric_stats'])}
- Segments: {json.dumps(summary['categorical_counts'])}
"""
    except Exception:
        pass

    # Build prompt for Claude
    user_prompt = f"""Generate 3 strategic intervention scenarios for this insight:

## Insight
Type: {insight_data['type']}
Priority: {insight_data['priority']}
Title: {insight_data['title']}
Description: {insight_data['description']}
Prediction: {insight_data['prediction'] or 'N/A'}
Prediction Detail: {insight_data['prediction_detail'] or 'N/A'}
Revenue Impact: ${insight_data['impact_revenue'] or 0}
Customers Affected: {insight_data['impact_customers'] or 0}
Confidence: {insight_data['confidence'] or 0}

{dataset_context}

Generate 3 distinct scenarios that address this insight. Each scenario should propose a different strategic approach.
"""

    # Call Claude — forward thinking events
    response_text = ""
    async for event in claude_client.stream_completion(
        system_prompt=SCENARIO_GENERATION_PROMPT,
        user_prompt=user_prompt,
        budget_tokens=1500,
        max_tokens=8000,
    ):
        if event["type"] == "thinking":
            yield {"type": "thinking", "data": {"content": event["content"]}}
        elif event["type"] == "text":
            response_text += event["content"]

    # Parse response
    try:
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        scenarios = json.loads(cleaned)
        if not isinstance(scenarios, list) or len(scenarios) != 3:
            raise ValueError("Expected 3 scenarios")

        # Add unique IDs if missing
        for i, scenario in enumerate(scenarios):
            if "id" not in scenario:
                scenario["id"] = f"scenario-{i+1}"

        # Normalize: ensure every node has data.params and node_params is aligned
        for scenario in scenarios:
            _normalize_scenario_params(scenario)

        yield {"type": "scenarios_result", "data": {"scenarios": scenarios}}
    except (json.JSONDecodeError, ValueError):
        # Fallback: return default scenarios
        yield {"type": "scenarios_result", "data": {"scenarios": _get_fallback_scenarios(insight_data)}}


def _normalize_scenario_params(scenario: Dict[str, Any]) -> None:
    """Ensure every node has data.params (ParamDef-style) and node_params matches."""
    node_params = scenario.get("node_params") or {}
    node_structure = scenario.get("node_structure") or []

    for node in node_structure:
        node_id = node.get("id", "")
        data = node.get("data") or {}
        params_defs = data.get("params")

        if not isinstance(params_defs, list):
            params_defs = []

        # Build params from node_params if we have values but no defs
        if not params_defs and node_id in node_params:
            flat = node_params[node_id]
            for key, value in flat.items():
                params_defs.append({
                    "key": key,
                    "label": key.replace("_", " ").title(),
                    "type": "number",
                    "default": float(value) if isinstance(value, (int, float)) else 0,
                    "min": 0,
                    "max": 100 if "pct" in key or "rate" in key else 1000000,
                    "step": 1,
                })

        # Source and modifier nodes should have at least one editable param (like templates)
        node_type = node.get("type", "")
        if node_type in ("source", "modifier") and not params_defs:
            node_label = data.get("label", node_id) or node_id
            default_key = "baseline_value" if node_type == "source" else "impact_factor"
            param_label = f"{node_label} (baseline)" if node_type == "source" else f"{node_label} impact"
            params_defs = [
                {
                    "key": default_key,
                    "label": param_label,
                    "type": "number",
                    "default": 100000.0 if node_type == "source" else 1.0,
                    "min": 0,
                    "max": 10000000 if node_type == "source" else 10,
                    "step": 1000 if node_type == "source" else 0.1,
                }
            ]
            if node_id not in node_params:
                node_params[node_id] = {}
            node_params[node_id][default_key] = params_defs[0]["default"]

        # Sync node_params from params defs (ensure every param key has a value)
        if params_defs:
            if node_id not in node_params:
                node_params[node_id] = {}
            for p in params_defs:
                if isinstance(p, dict) and "key" in p:
                    key = p["key"]
                    if key not in node_params[node_id]:
                        node_params[node_id][key] = p.get("default", 0)

        # Always set data.params so every node is normalized (e.g. sink nodes get [])
        data["params"] = params_defs
        node["data"] = data

    scenario["node_params"] = node_params
    scenario["node_structure"] = node_structure


def _get_fallback_scenarios(insight_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate fallback scenarios if Claude fails."""
    insight_type = insight_data.get("type", "trend")
    
    if insight_type in ["alert", "anomaly"]:
        # Retention-focused scenarios
        return [
            {
                "id": "scenario-1",
                "name": "Win-Back Campaign",
                "description": "Targeted email campaign with discount offers for at-risk customers",
                "template_type": "retention",
                "node_structure": [
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline metrics", "icon": "BarChart", "params": [{"key": "churn_rate", "label": "Churn Rate %", "type": "percentage", "default": 8.0, "min": 0, "max": 50, "step": 1}, {"key": "mrr", "label": "MRR ($)", "type": "currency", "default": 100000, "min": 10000, "max": 1000000, "step": 10000}]}},
                    {"id": "campaign", "type": "modifier", "position": {"x": 350, "y": 100}, "data": {"label": "Win-Back Campaign", "subtitle": "Email + discount", "icon": "Mail", "params": [{"key": "discount_pct", "label": "Discount %", "type": "percentage", "default": 20.0, "min": 0, "max": 50, "step": 5}, {"key": "response_rate", "label": "Response Rate %", "type": "percentage", "default": 15.0, "min": 1, "max": 50, "step": 1}]}},
                    {"id": "churn-reduction", "type": "modifier", "position": {"x": 350, "y": 260}, "data": {"label": "Churn Reduction", "subtitle": "Retention impact", "icon": "TrendingDown", "params": [{"key": "retention_boost", "label": "Retention Boost %", "type": "percentage", "default": 5.0, "min": 0, "max": 20, "step": 1}]}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign", "params": []}},
                ],
                "edge_structure": [
                    {"id": "e1", "source": "baseline", "target": "campaign"},
                    {"id": "e2", "source": "baseline", "target": "churn-reduction"},
                    {"id": "e3", "source": "campaign", "target": "revenue-impact"},
                    {"id": "e4", "source": "churn-reduction", "target": "revenue-impact"},
                ],
                "node_params": {
                    "baseline": {"churn_rate": 8.0, "mrr": 100000},
                    "campaign": {"discount_pct": 20.0, "response_rate": 15.0},
                    "churn-reduction": {"retention_boost": 5.0},
                },
                "rationale": "Direct intervention to reduce churn through targeted offers",
            },
            {
                "id": "scenario-2",
                "name": "Feature Enhancement",
                "description": "Build missing feature that addresses root cause of churn",
                "template_type": "feature",
                "node_structure": [
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline metrics", "icon": "BarChart", "params": [{"key": "churn_rate", "label": "Churn Rate %", "type": "percentage", "default": 8.0, "min": 0, "max": 50, "step": 1}, {"key": "mrr", "label": "MRR ($)", "type": "currency", "default": 100000, "min": 10000, "max": 1000000, "step": 10000}]}},
                    {"id": "feature-dev", "type": "modifier", "position": {"x": 350, "y": 100}, "data": {"label": "Feature Development", "subtitle": "Build time + cost", "icon": "Code", "params": [{"key": "dev_cost", "label": "Dev Cost ($)", "type": "currency", "default": 50000, "min": 10000, "max": 200000, "step": 5000}, {"key": "timeline_months", "label": "Timeline (months)", "type": "months", "default": 3, "min": 1, "max": 12, "step": 1}]}},
                    {"id": "adoption", "type": "modifier", "position": {"x": 350, "y": 260}, "data": {"label": "Feature Adoption", "subtitle": "Usage rate", "icon": "Users", "params": [{"key": "adoption_rate", "label": "Adoption Rate %", "type": "percentage", "default": 40.0, "min": 5, "max": 80, "step": 5}, {"key": "churn_reduction", "label": "Churn Reduction %", "type": "percentage", "default": 3.0, "min": 0, "max": 15, "step": 0.5}]}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign", "params": []}},
                ],
                "edge_structure": [
                    {"id": "e1", "source": "baseline", "target": "feature-dev"},
                    {"id": "e2", "source": "baseline", "target": "adoption"},
                    {"id": "e3", "source": "feature-dev", "target": "revenue-impact"},
                    {"id": "e4", "source": "adoption", "target": "revenue-impact"},
                ],
                "node_params": {
                    "baseline": {"churn_rate": 8.0, "mrr": 100000},
                    "feature-dev": {"dev_cost": 50000, "timeline_months": 3},
                    "adoption": {"adoption_rate": 40.0, "churn_reduction": 3.0},
                },
                "rationale": "Address root cause through product improvement",
            },
            {
                "id": "scenario-3",
                "name": "Pricing Adjustment",
                "description": "Adjust pricing strategy to improve retention",
                "template_type": "revenue",
                "node_structure": [
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current Pricing", "subtitle": "Baseline", "icon": "CreditCard", "params": [{"key": "churn_rate", "label": "Churn Rate %", "type": "percentage", "default": 8.0, "min": 0, "max": 50, "step": 1}, {"key": "mrr", "label": "MRR ($)", "type": "currency", "default": 100000, "min": 10000, "max": 1000000, "step": 10000}, {"key": "price", "label": "Price ($/mo)", "type": "currency", "default": 49, "min": 10, "max": 200, "step": 5}]}},
                    {"id": "price-change", "type": "modifier", "position": {"x": 350, "y": 100}, "data": {"label": "Price Change", "subtitle": "New pricing", "icon": "TrendingUp", "params": [{"key": "new_price", "label": "New Price ($/mo)", "type": "currency", "default": 39, "min": 10, "max": 200, "step": 5}, {"key": "price_change_pct", "label": "Price Change %", "type": "percentage", "default": -20.0, "min": -50, "max": 50, "step": 5}]}},
                    {"id": "churn-impact", "type": "modifier", "position": {"x": 350, "y": 260}, "data": {"label": "Churn Impact", "subtitle": "Retention change", "icon": "Users", "params": [{"key": "churn_reduction", "label": "Churn Reduction %", "type": "percentage", "default": 2.0, "min": 0, "max": 15, "step": 0.5}]}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign", "params": []}},
                ],
                "edge_structure": [
                    {"id": "e1", "source": "baseline", "target": "price-change"},
                    {"id": "e2", "source": "baseline", "target": "churn-impact"},
                    {"id": "e3", "source": "price-change", "target": "revenue-impact"},
                    {"id": "e4", "source": "churn-impact", "target": "revenue-impact"},
                ],
                "node_params": {
                    "baseline": {"churn_rate": 8.0, "mrr": 100000, "price": 49},
                    "price-change": {"new_price": 39, "price_change_pct": -20.0},
                    "churn-impact": {"churn_reduction": 2.0},
                },
                "rationale": "Improve retention through pricing optimization",
            },
        ]
    else:
        # Revenue/opportunity scenarios
        return [
            {
                "id": "scenario-1",
                "name": "Upsell Campaign",
                "description": "Targeted upsell to higher tier",
                "template_type": "revenue",
                "node_structure": [
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline", "icon": "BarChart", "params": [{"key": "mrr", "label": "MRR ($)", "type": "currency", "default": 100000, "min": 10000, "max": 1000000, "step": 10000}]}},
                    {"id": "upsell", "type": "modifier", "position": {"x": 350, "y": 180}, "data": {"label": "Upsell Campaign", "subtitle": "Conversion rate", "icon": "ArrowUp", "params": [{"key": "conversion_rate", "label": "Conversion Rate %", "type": "percentage", "default": 15.0, "min": 1, "max": 50, "step": 1}, {"key": "price_increase", "label": "Price Increase %", "type": "percentage", "default": 30.0, "min": 5, "max": 100, "step": 5}]}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign", "params": []}},
                ],
                "edge_structure": [
                    {"id": "e1", "source": "baseline", "target": "upsell"},
                    {"id": "e2", "source": "upsell", "target": "revenue-impact"},
                ],
                "node_params": {
                    "baseline": {"mrr": 100000},
                    "upsell": {"conversion_rate": 15.0, "price_increase": 30.0},
                },
                "rationale": "Increase revenue through upselling",
            },
            {
                "id": "scenario-2",
                "name": "New Tier Launch",
                "description": "Introduce new pricing tier",
                "template_type": "revenue",
                "node_structure": [
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline", "icon": "BarChart", "params": [{"key": "mrr", "label": "MRR ($)", "type": "currency", "default": 100000, "min": 10000, "max": 1000000, "step": 10000}]}},
                    {"id": "new-tier", "type": "modifier", "position": {"x": 350, "y": 180}, "data": {"label": "New Tier", "subtitle": "Pricing + adoption", "icon": "Layers", "params": [{"key": "tier_price", "label": "Tier Price ($/mo)", "type": "currency", "default": 99, "min": 20, "max": 500, "step": 5}, {"key": "adoption_rate", "label": "Adoption Rate %", "type": "percentage", "default": 10.0, "min": 1, "max": 50, "step": 1}]}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign", "params": []}},
                ],
                "edge_structure": [
                    {"id": "e1", "source": "baseline", "target": "new-tier"},
                    {"id": "e2", "source": "new-tier", "target": "revenue-impact"},
                ],
                "node_params": {
                    "baseline": {"mrr": 100000},
                    "new-tier": {"tier_price": 99, "adoption_rate": 10.0},
                },
                "rationale": "Capture more value with new tier",
            },
            {
                "id": "scenario-3",
                "name": "Feature Expansion",
                "description": "Add premium features to drive upgrades",
                "template_type": "feature",
                "node_structure": [
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline", "icon": "BarChart", "params": [{"key": "mrr", "label": "MRR ($)", "type": "currency", "default": 100000, "min": 10000, "max": 1000000, "step": 10000}]}},
                    {"id": "feature", "type": "modifier", "position": {"x": 350, "y": 180}, "data": {"label": "New Feature", "subtitle": "Development + adoption", "icon": "Code", "params": [{"key": "dev_cost", "label": "Dev Cost ($)", "type": "currency", "default": 75000, "min": 10000, "max": 200000, "step": 5000}, {"key": "upgrade_rate", "label": "Upgrade Rate %", "type": "percentage", "default": 12.0, "min": 1, "max": 50, "step": 1}]}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign", "params": []}},
                ],
                "edge_structure": [
                    {"id": "e1", "source": "baseline", "target": "feature"},
                    {"id": "e2", "source": "feature", "target": "revenue-impact"},
                ],
                "node_params": {
                    "baseline": {"mrr": 100000},
                    "feature": {"dev_cost": 75000, "upgrade_rate": 12.0},
                },
                "rationale": "Drive revenue through product investment",
            },
        ]


async def _run_single_simulation(
    scenario: Dict[str, Any],
    dataset_id: str,
    scenario_id: str,
) -> Dict[str, Any]:
    """Run a single simulation and return results, preserving full scenario metadata."""
    results: Dict[str, Any] = {
        "scenario_id": scenario_id,
        "scenario_name": scenario["name"],
        "fan_chart": None,
        "tornado_chart": None,
        "histogram": None,
        "scenario_table": None,
        "var_card": None,
        "summary": None,
        "error": None,
    }
    # Preserve scenario metadata for artifact generation (rationale, description, template_type)
    for key in ("rationale", "description", "template_type", "id"):
        if key in scenario:
            results[key] = scenario[key]

    try:
        # Convert node_params to the format expected by simulation_engine
        node_params = {}
        for node_id, params in scenario.get("node_params", {}).items():
            node_params[node_id] = {k: float(v) for k, v in params.items()}

        # Run simulation — collect thinking alongside chart data
        thinking_parts: list[str] = []
        async for event in simulation_engine.run_simulation(
            template_id=f"agentic-{scenario_id}",
            template_name=scenario["name"],
            node_params=node_params,
            node_structure=scenario["node_structure"],
            edge_structure=scenario["edge_structure"],
            dataset_id=dataset_id,
        ):
            if event["type"] in ["fan_chart", "tornado_chart", "histogram", "scenario_table", "var_card", "summary"]:
                results[event["type"]] = event["data"]
            elif event["type"] == "thinking":
                thinking_parts.append(event.get("data", {}).get("content", ""))

        if thinking_parts:
            results["thinking_log"] = "".join(thinking_parts)

        return results
    except Exception as e:
        results["error"] = str(e)
        return results


async def run_agentic_simulation(insight_id: str) -> AsyncGenerator[Dict[str, Any], None]:
    """Run agentic simulation: generate scenarios, run in parallel, compare results."""
    simulation_id = str(uuid.uuid4())
    
    yield {"type": "progress", "data": {"step": "Loading insight context..."}}
    
    # Get insight and dataset
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT dataset_id FROM insights WHERE id = ?",
            (insight_id,),
        )
        row = await cursor.fetchone()
        if not row:
            yield {"type": "error", "data": {"message": "Insight not found"}}
            return
        dataset_id = row[0]
    finally:
        await db.close()
    
    yield {"type": "progress", "data": {"step": "Generating 3 strategic scenarios..."}}

    # Generate scenarios — forward thinking events live
    scenarios = None
    try:
        async for event in generate_scenarios_stream(insight_id):
            if event["type"] == "thinking":
                yield event  # Forward thinking to SSE client
            elif event["type"] == "scenarios_result":
                scenarios = event["data"]["scenarios"]
    except Exception as e:
        yield {"type": "error", "data": {"message": f"Failed to generate scenarios: {str(e)}"}}
        return

    if not scenarios:
        yield {"type": "error", "data": {"message": "Failed to generate scenarios"}}
        return

    yield {"type": "scenarios_generated", "data": {"scenarios": scenarios}}
    
    # Run simulations — use as_completed for real-time per-scenario events
    yield {"type": "progress", "data": {"step": "Running simulations for each scenario..."}}

    # Create tasks with scenario id tracking
    task_map = {}
    for scenario in scenarios:
        yield {"type": "scenario_started", "data": {"scenario_id": scenario["id"], "scenario_name": scenario["name"]}}
        task = asyncio.create_task(_run_single_simulation(scenario, dataset_id, scenario["id"]))
        task_map[task] = scenario["id"]

    completed_results = []
    for coro in asyncio.as_completed(task_map.keys()):
        try:
            result = await coro
            completed_results.append(result)
            # Forward accumulated thinking from this scenario's simulation
            if result.get("thinking_log"):
                yield {
                    "type": "thinking",
                    "data": {"content": result["thinking_log"]},
                }
            yield {
                "type": "scenario_complete",
                "data": result,
            }
        except Exception as e:
            # Find which scenario failed
            yield {
                "type": "scenario_error",
                "data": {
                    "error": str(e),
                },
            }
    
    if not completed_results:
        yield {"type": "error", "data": {"message": "All simulations failed"}}
        return
    
    # Determine winner
    yield {"type": "progress", "data": {"step": "Comparing results and determining winner..."}}
    
    winning_scenario = _determine_winner(completed_results)

    # Build comparison data
    comparison_data = {
        "scenarios": completed_results,
        "winning_scenario_id": winning_scenario["scenario_id"],
        "baseline": _extract_baseline(completed_results),
    }

    # Save to database before yielding comparison_ready so the API can UPDATE
    # artifacts_json when it generates artifacts (record must exist first).
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO agentic_simulations 
               (id, insight_id, scenarios_json, comparison_data, winning_scenario_id)
               VALUES (?, ?, ?, ?, ?)""",
            (
                simulation_id,
                insight_id,
                json.dumps(scenarios),
                json.dumps(comparison_data),
                winning_scenario["scenario_id"],
            ),
        )
        await db.commit()
    finally:
        await db.close()

    yield {"type": "comparison_ready", "data": comparison_data}
    yield {"type": "complete", "data": {"simulation_id": simulation_id}}


def _determine_winner(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Determine winning scenario based on revenue impact."""
    best = None
    best_score = float("-inf")
    
    for result in results:
        if result.get("error"):
            continue
        
        # Extract revenue impact from var_card or scenario_table
        score = 0
        var_card = result.get("var_card", {})
        scenario_table = result.get("scenario_table", {})
        
        if var_card:
            score = var_card.get("expected_value", 0)
        elif scenario_table:
            scenarios = scenario_table.get("scenarios", [])
            if scenarios:
                # Use base case revenue impact
                score = scenarios[1].get("revenue_impact", 0) if len(scenarios) > 1 else scenarios[0].get("revenue_impact", 0)
        
        if score > best_score:
            best_score = score
            best = result
    
    return best or results[0]


def _extract_baseline(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract baseline projection from first scenario's fan chart."""
    if not results:
        return {}
    
    first_result = results[0]
    fan_chart = first_result.get("fan_chart", {})
    
    baseline_series = None
    for series in fan_chart.get("series", []):
        if series.get("id") == "baseline":
            baseline_series = series
            break
    
    # If no baseline series found, use the first scenario's fan chart structure
    # but mark it as baseline
    if not baseline_series and fan_chart.get("series"):
        baseline_series = {
            "id": "baseline",
            "label": "Status Quo (Baseline)",
            "data": fan_chart["series"][0].get("data", []),
        }
    
    return {
        "fan_chart": {
            "title": "Status Quo Projection",
            "x_label": fan_chart.get("x_label", "Month"),
            "y_label": fan_chart.get("y_label", "Revenue ($)"),
            "series": [baseline_series] if baseline_series else [],
        },
        "metrics": {
            "mrr": 0,
            "churn_rate": 0,
            "ltv": 0,
        },
    }
