import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.database import get_db
from app.models.schemas import InsightResponse, ExpandInsightResponse, ActionItemResponse
from app.services import insight_engine, data_processor

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=list[InsightResponse])
async def list_insights(
    dataset_id: str,
    type_filter: str | None = None,
    sort_by: str = "impact_score",
) -> list[InsightResponse]:
    db = await get_db()
    try:
        query = (
            "SELECT id, dataset_id, type, priority, title, description, "
            "impact_revenue, impact_customers, confidence, chart_data, "
            "ai_reasoning, impact_score, suggested_questions, dismissed, created_at, "
            "prediction, prediction_detail "
            "FROM insights WHERE dataset_id = ? AND dismissed = 0"
        )
        params: list[str] = [dataset_id]

        if type_filter:
            query += " AND type = ?"
            params.append(type_filter)

        sort_map = {
            "impact_score": "impact_score DESC NULLS LAST",
            "impact_revenue": "ABS(impact_revenue) DESC NULLS LAST",
            "created_at": "created_at DESC",
        }
        query += f" ORDER BY {sort_map.get(sort_by, sort_map['impact_score'])}"

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [
            InsightResponse(
                id=r[0], dataset_id=r[1], type=r[2], priority=r[3], title=r[4],
                description=r[5], impact_revenue=r[6], impact_customers=r[7],
                confidence=r[8], chart_data=json.loads(r[9]) if r[9] else None,
                ai_reasoning=r[10], impact_score=r[11],
                suggested_questions=json.loads(r[12]) if r[12] else None,
                dismissed=bool(r[13]), created_at=r[14],
                prediction=r[15], prediction_detail=r[16],
            )
            for r in rows
        ]
    finally:
        await db.close()


@router.get("/kpis")
async def get_kpis(dataset_id: str) -> dict:
    kpis = await data_processor.compute_kpis(dataset_id)
    if not kpis:
        raise HTTPException(status_code=404, detail="No data found for dataset")
    return kpis


@router.post("/generate")
async def generate_insights(dataset_id: str) -> StreamingResponse:
    # Verify dataset exists
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM datasets WHERE id = ?", (dataset_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Dataset not found")
    finally:
        await db.close()

    async def event_stream():
        async for event in insight_engine.generate_insights(dataset_id):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(insight_id: str) -> InsightResponse:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, dataset_id, type, priority, title, description, "
            "impact_revenue, impact_customers, confidence, chart_data, "
            "ai_reasoning, impact_score, suggested_questions, dismissed, created_at, "
            "prediction, prediction_detail "
            "FROM insights WHERE id = ?",
            (insight_id,),
        )
        r = await cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Insight not found")
        return InsightResponse(
            id=r[0], dataset_id=r[1], type=r[2], priority=r[3], title=r[4],
            description=r[5], impact_revenue=r[6], impact_customers=r[7],
            confidence=r[8], chart_data=json.loads(r[9]) if r[9] else None,
            ai_reasoning=r[10], impact_score=r[11],
            suggested_questions=json.loads(r[12]) if r[12] else None,
            dismissed=bool(r[13]), created_at=r[14],
            prediction=r[15], prediction_detail=r[16],
        )
    finally:
        await db.close()


@router.post("/{insight_id}/expand", response_model=ExpandInsightResponse)
async def expand_insight(insight_id: str) -> ExpandInsightResponse:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, dataset_id, type, priority, title, description, impact_revenue, impact_customers, confidence, ai_reasoning FROM insights WHERE id = ?",
            (insight_id,),
        )
        r = await cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Insight not found")

        # Cache hit — return existing reasoning
        if r[9]:
            return ExpandInsightResponse(insight_id=r[0], ai_reasoning=r[9])

        insight_row = {
            "title": r[4],
            "type": r[2],
            "priority": r[3],
            "description": r[5],
            "impact_revenue": r[6],
            "impact_customers": r[7],
            "confidence": r[8],
        }
        dataset_id = r[1]
    finally:
        await db.close()

    # Generate reasoning via Claude
    try:
        reasoning = await insight_engine.generate_expanded_reasoning(insight_row, dataset_id)
    except Exception:
        reasoning = (
            "## Analysis Unavailable\n\n"
            "Unable to generate detailed analysis at this time. Please try again later."
        )

    # Save to DB for caching (including fallback, so we don't retry on every click)
    db = await get_db()
    try:
        await db.execute(
            "UPDATE insights SET ai_reasoning = ? WHERE id = ?",
            (reasoning, insight_id),
        )
        await db.commit()
    finally:
        await db.close()

    return ExpandInsightResponse(insight_id=insight_id, ai_reasoning=reasoning)


@router.patch("/{insight_id}/dismiss")
async def dismiss_insight(insight_id: str) -> dict[str, str]:
    db = await get_db()
    try:
        await db.execute("UPDATE insights SET dismissed = 1 WHERE id = ?", (insight_id,))
        await db.commit()
    finally:
        await db.close()
    return {"status": "dismissed"}


@router.post("/{insight_id}/actions")
async def generate_actions(insight_id: str) -> StreamingResponse:
    """Stream-generate action items for an insight via SSE."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM insights WHERE id = ?", (insight_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Insight not found")
    finally:
        await db.close()

    async def event_stream():
        async for event in insight_engine.generate_actions(insight_id):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{insight_id}/actions", response_model=list[ActionItemResponse])
async def list_actions(insight_id: str) -> list[ActionItemResponse]:
    """List cached action items for an insight."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, insight_id, dataset_id, title, description, "
            "priority, effort, category, added_to_plan, created_at "
            "FROM action_items WHERE insight_id = ? ORDER BY "
            "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END",
            (insight_id,),
        )
        rows = await cursor.fetchall()
        return [
            ActionItemResponse(
                id=r[0], insight_id=r[1], dataset_id=r[2], title=r[3],
                description=r[4], priority=r[5], effort=r[6], category=r[7],
                added_to_plan=bool(r[8]), created_at=r[9],
            )
            for r in rows
        ]
    finally:
        await db.close()


@router.patch("/actions/{action_id}/plan")
async def toggle_action_plan(action_id: str) -> dict[str, bool]:
    """Toggle an action item's added_to_plan status."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT added_to_plan FROM action_items WHERE id = ?", (action_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Action item not found")

        new_value = 0 if row[0] else 1
        await db.execute(
            "UPDATE action_items SET added_to_plan = ? WHERE id = ?",
            (new_value, action_id),
        )
        await db.commit()
        return {"added_to_plan": bool(new_value)}
    finally:
        await db.close()


@router.get("/action-plan", response_model=list[ActionItemResponse])
async def get_action_plan(dataset_id: str) -> list[ActionItemResponse]:
    """Get all action items added to the plan for a dataset."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT a.id, a.insight_id, a.dataset_id, a.title, a.description, "
            "a.priority, a.effort, a.category, a.added_to_plan, a.created_at "
            "FROM action_items a "
            "WHERE a.dataset_id = ? AND a.added_to_plan = 1 "
            "ORDER BY CASE a.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END",
            (dataset_id,),
        )
        rows = await cursor.fetchall()
        return [
            ActionItemResponse(
                id=r[0], insight_id=r[1], dataset_id=r[2], title=r[3],
                description=r[4], priority=r[5], effort=r[6], category=r[7],
                added_to_plan=bool(r[8]), created_at=r[9],
            )
            for r in rows
        ]
    finally:
        await db.close()
