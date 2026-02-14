import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.models.database import get_db
from app.models.schemas import (
    SimulationResponse,
    RunGraphSimulationRequest,
    NodeContextRequest,
    NodeContextResponse,
)
from app.services import simulation_engine, agentic_simulation, artifact_generator, claude_client

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.post("/run-graph")
async def run_graph_simulation(req: RunGraphSimulationRequest) -> StreamingResponse:
    async def event_stream():
        async for event in simulation_engine.run_simulation(
            template_id=req.template_id,
            template_name=req.template_name,
            node_params=req.node_params,
            node_structure=req.node_structure,
            edge_structure=req.edge_structure,
            dataset_id=req.dataset_id,
            node_context=req.node_context,
        ):
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


NODE_CONTEXT_SYSTEM = """You are helping a product manager add specific details to a simulation node. The user is describing context, assumptions, or constraints for this node in a causal simulation graph. Reply in 2-4 short sentences: acknowledge their input and suggest concrete numbers or ranges they could use for this node's parameters if relevant. Be specific and actionable. If they ask a question, answer it directly."""


@router.post("/node-context", response_model=NodeContextResponse)
async def get_node_context_reply(req: NodeContextRequest) -> NodeContextResponse:
    """Get Claude's reply to user-provided context for a simulation node."""
    user_prompt = f"""Node: "{req.node_label}" (type: {req.node_type}).

User message: {req.user_message}

Reply with specific, actionable guidance for this node (2-4 sentences)."""
    reply = await claude_client.complete_no_thinking(
        system_prompt=NODE_CONTEXT_SYSTEM,
        user_prompt=user_prompt,
        max_tokens=512,
    )
    return NodeContextResponse(reply=reply or "No response.")


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


class TriggerAgenticSimulationRequest(BaseModel):
    insight_id: str


@router.post("/agentic/trigger")
async def trigger_agentic_simulation(req: TriggerAgenticSimulationRequest) -> StreamingResponse:
    """Trigger agentic simulation for an insight."""
    async def event_stream():
        artifacts_generated = False
        winning_scenario = None
        simulation_results = None
        
        async for event in agentic_simulation.run_agentic_simulation(req.insight_id):
            yield f"data: {json.dumps(event)}\n\n"
            
            # When comparison is ready, generate artifacts
            if event["type"] == "comparison_ready" and not artifacts_generated:
                comparison_data = event["data"]
                winning_scenario_id = comparison_data.get("winning_scenario_id")
                
                if winning_scenario_id:
                    # Find winning scenario
                    for scenario in comparison_data.get("scenarios", []):
                        if scenario.get("scenario_id") == winning_scenario_id:
                            winning_scenario = scenario
                            simulation_results = scenario
                            break
                    
                    if winning_scenario:
                        yield f"data: {json.dumps({'type': 'progress', 'data': {'step': 'Generating actionable artifacts...'}})}\n\n"
                        
                        try:
                            artifacts = await artifact_generator.generate_artifacts(
                                req.insight_id,
                                winning_scenario,
                                simulation_results,
                            )
                            
                            # Update database with artifacts
                            db = await get_db()
                            try:
                                cursor = await db.execute(
                                    "SELECT id FROM agentic_simulations WHERE insight_id = ? ORDER BY created_at DESC LIMIT 1",
                                    (req.insight_id,),
                                )
                                row = await cursor.fetchone()
                                if row:
                                    await db.execute(
                                        "UPDATE agentic_simulations SET artifacts_json = ? WHERE id = ?",
                                        (json.dumps(artifacts), row[0]),
                                    )
                                    await db.commit()
                            finally:
                                await db.close()
                            
                            yield f"data: {json.dumps({'type': 'artifacts_ready', 'data': {'artifacts': artifacts}})}\n\n"
                        except Exception as e:
                            yield f"data: {json.dumps({'type': 'error', 'data': {'message': f'Failed to generate artifacts: {str(e)}'}})}\n\n"
                        
                        artifacts_generated = True
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/agentic/{insight_id}")
async def get_agentic_simulation(insight_id: str) -> dict:
    """Get cached agentic simulation results for an insight."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, scenarios_json, comparison_data, winning_scenario_id, artifacts_json, created_at
               FROM agentic_simulations 
               WHERE insight_id = ? 
               ORDER BY created_at DESC 
               LIMIT 1""",
            (insight_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agentic simulation not found")
        
        return {
            "id": row[0],
            "scenarios": json.loads(row[1]),
            "comparison_data": json.loads(row[2]),
            "winning_scenario_id": row[3],
            "artifacts": json.loads(row[4]) if row[4] else [],
            "created_at": row[5],
        }
    finally:
        await db.close()
