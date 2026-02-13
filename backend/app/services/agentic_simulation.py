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
        "icon": "IconName"
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
      "param-key": value (number),
      ...
    }
  },
  "rationale": "Why this strategy addresses the insight"
}

Template types guide:
- "retention": Focus on reducing churn, improving retention (discounts, loyalty programs, feature improvements)
- "revenue": Focus on increasing revenue (pricing changes, upsells, new tiers)
- "feature": Focus on product investments (new features, integrations, capabilities)

Keep node structures simple (3-5 nodes max). Use realistic parameter values based on the insight context.
Return ONLY the JSON array, no markdown, no code fences."""


async def generate_scenarios(insight_id: str) -> List[Dict[str, Any]]:
    """Generate 3 strategic scenarios based on an insight."""
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

    # Call Claude
    response_text = ""
    async for event in claude_client.stream_completion(
        system_prompt=SCENARIO_GENERATION_PROMPT,
        user_prompt=user_prompt,
        budget_tokens=1500,
        max_tokens=8000,
    ):
        if event["type"] == "text":
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
        
        return scenarios
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback: return default scenarios
        return _get_fallback_scenarios(insight_data)


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
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline metrics", "icon": "BarChart"}},
                    {"id": "campaign", "type": "modifier", "position": {"x": 350, "y": 100}, "data": {"label": "Win-Back Campaign", "subtitle": "Email + discount", "icon": "Mail"}},
                    {"id": "churn-reduction", "type": "modifier", "position": {"x": 350, "y": 260}, "data": {"label": "Churn Reduction", "subtitle": "Retention impact", "icon": "TrendingDown"}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign"}},
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
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline metrics", "icon": "BarChart"}},
                    {"id": "feature-dev", "type": "modifier", "position": {"x": 350, "y": 100}, "data": {"label": "Feature Development", "subtitle": "Build time + cost", "icon": "Code"}},
                    {"id": "adoption", "type": "modifier", "position": {"x": 350, "y": 260}, "data": {"label": "Feature Adoption", "subtitle": "Usage rate", "icon": "Users"}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign"}},
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
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current Pricing", "subtitle": "Baseline", "icon": "CreditCard"}},
                    {"id": "price-change", "type": "modifier", "position": {"x": 350, "y": 100}, "data": {"label": "Price Change", "subtitle": "New pricing", "icon": "TrendingUp"}},
                    {"id": "churn-impact", "type": "modifier", "position": {"x": 350, "y": 260}, "data": {"label": "Churn Impact", "subtitle": "Retention change", "icon": "Users"}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign"}},
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
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline", "icon": "BarChart"}},
                    {"id": "upsell", "type": "modifier", "position": {"x": 350, "y": 180}, "data": {"label": "Upsell Campaign", "subtitle": "Conversion rate", "icon": "ArrowUp"}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign"}},
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
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline", "icon": "BarChart"}},
                    {"id": "new-tier", "type": "modifier", "position": {"x": 350, "y": 180}, "data": {"label": "New Tier", "subtitle": "Pricing + adoption", "icon": "Layers"}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign"}},
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
                    {"id": "baseline", "type": "source", "position": {"x": 50, "y": 180}, "data": {"label": "Current State", "subtitle": "Baseline", "icon": "BarChart"}},
                    {"id": "feature", "type": "modifier", "position": {"x": 350, "y": 180}, "data": {"label": "New Feature", "subtitle": "Development + adoption", "icon": "Code"}},
                    {"id": "revenue-impact", "type": "sink", "position": {"x": 650, "y": 180}, "data": {"label": "Revenue Impact", "subtitle": "Net change", "icon": "DollarSign"}},
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
        
        # Run simulation
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
    
    # Generate scenarios
    try:
        scenarios = await generate_scenarios(insight_id)
    except Exception as e:
        yield {"type": "error", "data": {"message": f"Failed to generate scenarios: {str(e)}"}}
        return
    
    yield {"type": "scenarios_generated", "data": {"scenarios": scenarios}}
    
    # Run simulations in parallel
    yield {"type": "progress", "data": {"step": "Running simulations in parallel..."}}
    
    tasks = [
        _run_single_simulation(scenario, dataset_id, scenario["id"])
        for scenario in scenarios
    ]
    
    simulation_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process results
    completed_results = []
    for i, result in enumerate(simulation_results):
        if isinstance(result, Exception):
            yield {
                "type": "scenario_error",
                "data": {
                    "scenario_id": scenarios[i]["id"],
                    "error": str(result),
                },
            }
        else:
            completed_results.append(result)
            yield {
                "type": "scenario_complete",
                "data": result,
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
