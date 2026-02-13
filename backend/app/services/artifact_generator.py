import json
from typing import Dict, List, Any
from app.services import claude_client
from app.models.database import get_db


ARTIFACT_SYSTEM_PROMPT = """You are a product strategist. Given a simulation scenario and its results, generate actionable artifacts.

Generate artifacts based on the scenario type:
- Retention scenarios: Email drafts for win-back campaigns
- Revenue scenarios: PDF proposals for pricing changes or new tiers
- Feature scenarios: Jira tickets and PRDs for product development

Return a JSON object with this structure:
{
  "artifacts": [
    {
      "type": "email" | "pdf" | "jira_ticket" | "prd",
      "title": "Artifact title",
      "content": "Full content (for email: HTML-ready text, for PDF: markdown, for jira: JSON, for PRD: markdown)",
      "metadata": {
        "recipients": ["email1@example.com"] (for emails),
        "priority": "high" | "medium" | "low" (for jira),
        "labels": ["label1", "label2"] (for jira),
        "sections": ["section1", "section2"] (for PRD)
      }
    }
  ]
}

Be specific and actionable. Use real numbers from the simulation results. Return ONLY valid JSON."""


async def generate_artifacts(
    insight_id: str,
    winning_scenario: Dict[str, Any],
    simulation_results: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Generate artifacts for a winning scenario."""
    
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
    
    # Build prompt
    user_prompt = f"""Generate actionable artifacts for this winning simulation scenario:

## Insight Context
Type: {insight_data['type']}
Title: {insight_data['title']}
Description: {insight_data['description']}
Revenue Impact: ${insight_data['impact_revenue'] or 0}
Customers Affected: {insight_data['impact_customers'] or 0}
Prediction: {insight_data['prediction'] or 'N/A'}

## Winning Scenario
Name: {winning_scenario.get('scenario_name', 'Unknown')}
Description: {winning_scenario.get('rationale', 'N/A')}

## Simulation Results
Summary: {simulation_results.get('summary', 'N/A')}
Expected Value: ${simulation_results.get('var_card', {}).get('expected_value', 0)}
Revenue Impact: {json.dumps(simulation_results.get('scenario_table', {}).get('scenarios', []))}

Generate appropriate artifacts based on the scenario type. For retention scenarios, generate email drafts. For revenue scenarios, generate PDF proposals. For feature scenarios, generate Jira tickets and PRDs.
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
            artifacts = _generate_fallback_artifacts(winning_scenario, insight_data)
        
        return artifacts
    except json.JSONDecodeError:
        return _generate_fallback_artifacts(winning_scenario, insight_data)


def _generate_fallback_artifacts(
    winning_scenario: Dict[str, Any],
    insight_data: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Generate fallback artifacts if Claude fails."""
    scenario_name = winning_scenario.get("scenario_name", "Strategy")
    scenario_type = winning_scenario.get("template_type", "revenue")
    
    artifacts = []
    
    if scenario_type == "retention":
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
    
    else:  # feature
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
    
    return artifacts
