import json
from typing import Dict, List, Any
from app.services import claude_client
from app.models.database import get_db


ARTIFACT_SYSTEM_PROMPT = """You are a product strategist. Given a simulation scenario and its results, generate actionable artifacts grounded in the simulation summary and insight.

Allowed artifact types: executive_one_pager, slack_update, email, pdf, jira_ticket, prd, meeting_agenda.

Return a JSON object with this structure:
{
  "artifacts": [
    {
      "type": "executive_one_pager" | "slack_update" | "email" | "pdf" | "jira_ticket" | "prd" | "meeting_agenda",
      "title": "Artifact title",
      "content": "Full content. Use exact numbers and bullets from the simulation summary; do not invent figures.",
      "metadata": {}
    }
  ]
}

Content guidelines:
- executive_one_pager: 5-7 bullets with **Investment**, **Revenue impact**, **Payback**, **Risks**. Use **bold** for key numbers.
- slack_update: Short message for #product/#growth: key numbers, one CTA, no markdown blocks.
- email: Subject + body; use simulation numbers in the copy.
- meeting_agenda: 30-min agenda: Context (2 min), Numbers (5 min), Decision (15 min), Next steps (5 min).
- jira_ticket: JSON with summary, description, issueType, priority, labels. Description must cite simulation.
- prd: Markdown with Problem, Goals, Success metrics (from simulation), User stories.
- pdf: Markdown proposal outline (sections only with 1-line each).

Generate ONLY the artifact types requested. Use the simulation summary verbatim for numbers. Return ONLY valid JSON."""


def _default_artifact_types(winning_scenario: Dict[str, Any]) -> List[str]:
    """Default artifact set: one-pager + Slack + email for all; add jira/prd for feature, pdf for revenue."""
    template_type = (winning_scenario.get("template_type") or "").lower()
    base = ["executive_one_pager", "slack_update", "email"]
    if template_type == "feature":
        return base + ["jira_ticket", "prd"]
    if template_type == "revenue":
        return base + ["pdf"]
    return base + ["meeting_agenda"]


async def generate_artifacts(
    insight_id: str,
    winning_scenario: Dict[str, Any],
    simulation_results: Dict[str, Any],
    requested_types: List[str] | None = None,
) -> List[Dict[str, Any]]:
    """Generate artifacts for a winning scenario. If requested_types is set, generate only those."""
    
    # Load insight context
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT type, title, description, impact_revenue, impact_customers,
                      prediction, prediction_detail
               FROM insights WHERE id = ?""",
            (insight_id,),
        )
        row = await cursor.fetchone()
        if not row:
            return []
        
        insight_data = {
            "type": row[0],
            "title": row[1],
            "description": row[2],
            "impact_revenue": row[3],
            "impact_customers": row[4],
            "prediction": row[5],
            "prediction_detail": row[6],
        }
    finally:
        await db.close()
    
    types_to_generate = requested_types or _default_artifact_types(winning_scenario)
    scenario_name = winning_scenario.get("scenario_name") or winning_scenario.get("name") or "Winning scenario"
    
    # Build prompt with simulation summary prominent so artifacts use real numbers
    summary_block = simulation_results.get("summary") or "N/A"
    var_card = simulation_results.get("var_card") or {}
    scenario_table = simulation_results.get("scenario_table") or {}
    
    user_prompt = f"""Generate ONLY these artifact types: {json.dumps(types_to_generate)}.

## Insight Context
Type: {insight_data['type']}
Title: {insight_data['title']}
Description: {insight_data['description']}
Revenue Impact: ${insight_data['impact_revenue'] or 0}
Customers Affected: {insight_data['impact_customers'] or 0}
Prediction: {insight_data['prediction'] or 'N/A'}

## Winning Scenario
Name: {scenario_name}
Description: {winning_scenario.get('description', winning_scenario.get('rationale', 'N/A'))}
Rationale: {winning_scenario.get('rationale', 'N/A')}
Template type: {winning_scenario.get('template_type', 'N/A')}

## Simulation Results (use these exact numbers in artifacts)
Summary (bullet points – cite these verbatim where relevant):
{summary_block}

Expected Value: ${var_card.get('expected_value', 0)}
VaR: ${var_card.get('var_amount', 0)}
Scenario table: {json.dumps(scenario_table.get('scenarios', [])[:3])}

Generate exactly {len(types_to_generate)} artifacts, one per requested type. Use the simulation summary numbers in every artifact. Return ONLY valid JSON.
"""

    # Call Claude
    response_text = ""
    async for event in claude_client.stream_completion(
        system_prompt=ARTIFACT_SYSTEM_PROMPT,
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
        
        result = json.loads(cleaned)
        artifacts = result.get("artifacts", [])
        
        # Ensure we have at least one artifact
        if not artifacts:
            artifacts = _generate_fallback_artifacts(
                winning_scenario, insight_data, requested_types=types_to_generate
            )
        
        return artifacts
    except json.JSONDecodeError:
        return _generate_fallback_artifacts(
            winning_scenario, insight_data, requested_types=types_to_generate
        )


def _generate_fallback_artifacts(
    winning_scenario: Dict[str, Any],
    insight_data: Dict[str, Any],
    requested_types: List[str] | None = None,
) -> List[Dict[str, Any]]:
    """Generate fallback artifacts if Claude fails."""
    scenario_name = winning_scenario.get("scenario_name") or winning_scenario.get("name") or "Strategy"
    scenario_type = (winning_scenario.get("template_type") or "revenue").lower()
    types_wanted = requested_types or _default_artifact_types(winning_scenario)
    
    artifacts = []
    summary = (winning_scenario.get("summary") or "").strip() or "See simulation results for key numbers."

    # Executive one-pager (always include if requested)
    if "executive_one_pager" in types_wanted:
        artifacts.append({
            "type": "executive_one_pager",
            "title": f"One-pager: {scenario_name}",
            "content": f"# {scenario_name}\n\n{summary}\n\n## Next steps\n- [ ] Review with stakeholders\n- [ ] Align on timeline",
            "metadata": {},
        })

    # Slack update
    if "slack_update" in types_wanted:
        artifacts.append({
            "type": "slack_update",
            "title": f"Slack update: {scenario_name}",
            "content": f"Simulation result: {scenario_name}. Key outcomes: {summary[:200]}...",
            "metadata": {},
        })

    # Meeting agenda
    if "meeting_agenda" in types_wanted:
        artifacts.append({
            "type": "meeting_agenda",
            "title": f"Meeting agenda: {scenario_name}",
            "content": f"""# 30-min agenda: {scenario_name}

## Context (2 min)
{summary[:300]}

## Numbers (5 min)
- Review simulation outcomes
- Key metrics from scenario

## Decision (15 min)
- Align on next steps
- Owners and timeline

## Next steps (5 min)
- [ ] Action items
- [ ] Follow-up""",
            "metadata": {},
        })

    if scenario_type == "retention" and "email" in types_wanted:
        # Email draft
        artifacts.append({
            "type": "email",
            "title": f"Win-Back Campaign: {scenario_name}",
            "content": f"""Subject: We Miss You - Exclusive Offer Inside

Hi [Customer Name],

We noticed you haven't been active recently, and we wanted to reach out with a special offer.

Based on our analysis, we understand that [brief reason from insight]. We'd love to help you get back on track.

**Exclusive Offer:**
- [Discount/Offer details]
- Valid until [date]
- [Additional benefits]

We're here to help you succeed. If you have any questions, just reply to this email.

Best regards,
[Your Name]
[Company Name]""",
            "metadata": {
                "recipients": ["at-risk-customers@example.com"],
            },
        })
    
    elif scenario_type == "revenue":
        if "pdf" in types_wanted:
            # PDF proposal
            artifacts.append({
            "type": "pdf",
            "title": f"Pricing Strategy Proposal: {scenario_name}",
            "content": f"""# Pricing Strategy Proposal: {scenario_name}

## Executive Summary
{insight_data.get('description', 'N/A')}

## Current Situation
- Revenue Impact: ${insight_data.get('impact_revenue', 0)}
- Customers Affected: {insight_data.get('impact_customers', 0)}

## Proposed Strategy
{scenario_name}

## Expected Outcomes
- Revenue Impact: [To be filled from simulation]
- Timeline: 3-6 months
- Risk Level: Moderate

## Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Next Steps
[Action items]""",
            "metadata": {},
        })
        if "email" in types_wanted:
            artifacts.append({
                "type": "email",
                "title": f"Stakeholder update: {scenario_name}",
                "content": f"Subject: Simulation outcome – {scenario_name}\n\n{summary}",
                "metadata": {},
            })
    
    if scenario_type == "feature" or "jira_ticket" in types_wanted or "prd" in types_wanted:
        if "jira_ticket" in types_wanted:
            # Jira ticket
            artifacts.append({
            "type": "jira_ticket",
            "title": f"Feature: {scenario_name}",
            "content": json.dumps({
                "summary": f"Implement {scenario_name}",
                "description": f"{insight_data.get('description', 'N/A')}\n\nRationale: {winning_scenario.get('rationale', 'N/A')}",
                "issueType": "Story",
                "priority": "High",
                "labels": ["product", "feature", "simulation"],
                "components": ["Product"],
            }),
            "metadata": {
                "priority": "high",
                "labels": ["product", "feature"],
            },
        })
        if "prd" in types_wanted:
            # PRD
            artifacts.append({
            "type": "prd",
            "title": f"PRD: {scenario_name}",
            "content": f"""# Product Requirements Document: {scenario_name}

## Overview
{insight_data.get('description', 'N/A')}

## Problem Statement
{insight_data.get('prediction_detail', 'N/A')}

## Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

## User Stories
- As a [user type], I want [feature] so that [benefit]

## Success Metrics
- [Metric 1]
- [Metric 2]

## Technical Requirements
- [Requirement 1]
- [Requirement 2]

## Timeline
- [Timeline details]""",
            "metadata": {
                "sections": ["Overview", "Problem Statement", "Goals", "User Stories", "Success Metrics"],
            },
        })

    # Generic email when type is not retention/revenue (e.g. feature)
    if "email" in types_wanted and scenario_type not in ("retention", "revenue"):
        artifacts.append({
            "type": "email",
            "title": f"Update: {scenario_name}",
            "content": f"Subject: Simulation outcome – {scenario_name}\n\n{summary}",
            "metadata": {},
        })

    return artifacts
