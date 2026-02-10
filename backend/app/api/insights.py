import json
from fastapi import APIRouter, HTTPException
from app.models.database import get_db
from app.models.schemas import InsightResponse

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=list[InsightResponse])
async def list_insights(dataset_id: str) -> list[InsightResponse]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, dataset_id, type, priority, title, description, impact_revenue, impact_customers, confidence, chart_data, ai_reasoning, dismissed, created_at FROM insights WHERE dataset_id = ? AND dismissed = 0 ORDER BY created_at DESC",
            (dataset_id,),
        )
        rows = await cursor.fetchall()
        return [
            InsightResponse(
                id=r[0], dataset_id=r[1], type=r[2], priority=r[3], title=r[4],
                description=r[5], impact_revenue=r[6], impact_customers=r[7],
                confidence=r[8], chart_data=json.loads(r[9]) if r[9] else None,
                ai_reasoning=r[10], dismissed=bool(r[11]), created_at=r[12],
            )
            for r in rows
        ]
    finally:
        await db.close()


@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(insight_id: str) -> InsightResponse:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, dataset_id, type, priority, title, description, impact_revenue, impact_customers, confidence, chart_data, ai_reasoning, dismissed, created_at FROM insights WHERE id = ?",
            (insight_id,),
        )
        r = await cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Insight not found")
        return InsightResponse(
            id=r[0], dataset_id=r[1], type=r[2], priority=r[3], title=r[4],
            description=r[5], impact_revenue=r[6], impact_customers=r[7],
            confidence=r[8], chart_data=json.loads(r[9]) if r[9] else None,
            ai_reasoning=r[10], dismissed=bool(r[11]), created_at=r[12],
        )
    finally:
        await db.close()


@router.patch("/{insight_id}/dismiss")
async def dismiss_insight(insight_id: str) -> dict[str, str]:
    db = await get_db()
    try:
        await db.execute("UPDATE insights SET dismissed = 1 WHERE id = ?", (insight_id,))
        await db.commit()
    finally:
        await db.close()
    return {"status": "dismissed"}
