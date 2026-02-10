import json
from fastapi import APIRouter, HTTPException
from app.models.database import get_db
from app.models.schemas import SimulationResponse

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.get("", response_model=list[SimulationResponse])
async def list_simulations(dataset_id: str) -> list[SimulationResponse]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, dataset_id, feature_name, parameters, results, recommendation, confidence, created_at FROM simulations WHERE dataset_id = ? ORDER BY created_at DESC",
            (dataset_id,),
        )
        rows = await cursor.fetchall()
        return [
            SimulationResponse(
                id=r[0], dataset_id=r[1], feature_name=r[2],
                parameters=json.loads(r[3]), results=json.loads(r[4]),
                recommendation=r[5], confidence=r[6], created_at=r[7],
            )
            for r in rows
        ]
    finally:
        await db.close()


@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(simulation_id: str) -> SimulationResponse:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, dataset_id, feature_name, parameters, results, recommendation, confidence, created_at FROM simulations WHERE id = ?",
            (simulation_id,),
        )
        r = await cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Simulation not found")
        return SimulationResponse(
            id=r[0], dataset_id=r[1], feature_name=r[2],
            parameters=json.loads(r[3]), results=json.loads(r[4]),
            recommendation=r[5], confidence=r[6], created_at=r[7],
        )
    finally:
        await db.close()
