# Implementation Plan - Layered Dashboard & Prescriptive Insights

## Goal Description
Enhance the dashboard to support layered interactions:
1.  **Top Layer**: Highlight key predictive outcomes (e.g., "Churn will rise 10%...").
2.  **Drill-down**: Deep dive into *why* (Reasoning).
3.  **Prescriptive**: suggest "Next Steps" as an actionable task list.

## User Review Required
> [!IMPORTANT]
> This requires changing the LLM prompts and the data model for `Insight`. Existing insights in the database might need a migration or will just lack these new fields (backward compatibility will be handled).

## Proposed Changes

### Backend (`backend/app/`)

#### [MODIFY] [schemas.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/models/schemas.py)
- Update `InsightResponse` to include:
    - `prediction`: `Optional[str]`
    - `actionable_steps`: `Optional[List[str]]` (or a structured object if we want more detail like priority/deadline, for now simple strings might be easier for the LLM to reliably generate, but user asked for "task list tied to insights", maybe sticking to strings is safer for starters, or simple dicts). Let's go with a list of strings for simplicity and robustness.

#### [MODIFY] [insight_engine.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/insight_engine.py)
- Update `SYSTEM_PROMPT` to instruct Claude to generate:
    - `"prediction"`: A predictive statement.
    - `"actionable_steps"`: A list of concrete actions.
- Update `generate_insights` to parse these new fields and save them.
- Update the SQL `INSERT` statement to store these new fields (requires DB schema update).

#### [MODIFY] [database.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/models/database.py) (or `schema.sql` if it exists)
- I need to check how the DB is initialized. If it's SQLite and just "connect", I might need to run a migration or just alter the table if it exists. Since this is a prototype/hackathon project, I might just add a column or handle missing columns gracefully. I'll check `backend/app/models/database.py`.

### Frontend (`frontend/src/`)

#### [MODIFY] [api.ts](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/lib/api.ts)
- Update `InsightResponse` interface to match backend.

#### [MODIFY] [InsightCard.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/dashboard/InsightCard.tsx)
- **Top Layer**: Display `prediction` if available. If not, fall back to `description`.
- **Expanded View**:
    - Add a "Recommended Actions" section.
    - Render `actionable_steps` as a checklist (UI only, maybe clickable to "dismiss" or "mark done" locally for effect).
    - Ensure `ai_reasoning` is still available for the "Deep Dive".

## Verification Plan

### Automated Tests
- I will run the backend `generate_insights` function (via a script or test) to verify that Claude returns the new structure.
- I will verify that the frontend renders the new fields.

### Manual Verification
1.  **Generate Insights**: Run the insight generation process (using the "Regenerate" button in the UI).
2.  **Verify UI**:
    - Check if the "Prediction" text is visible on the card.
    - Click "Expand" on a card.
    - Check if "Recommended Actions" list is visible.
    - Check if "Reasoning" is visible.
