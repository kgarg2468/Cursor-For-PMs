import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    CopilotClassifyRequest,
    CopilotClassifyResponse,
    CopilotInsightRequest,
    CopilotQuickAnswerRequest,
)
from app.services import copilot_service

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


@router.post("/classify", response_model=CopilotClassifyResponse)
async def classify_intent(req: CopilotClassifyRequest) -> CopilotClassifyResponse:
    result = await copilot_service.classify_intent(
        prompt=req.prompt,
        dataset_id=req.dataset_id,
        current_route=req.current_route,
    )
    return CopilotClassifyResponse(**result)


@router.post("/quick-answer")
async def quick_answer(req: CopilotQuickAnswerRequest) -> StreamingResponse:
    async def event_stream():
        async for event in copilot_service.stream_quick_answer(
            prompt=req.prompt,
            dataset_id=req.dataset_id,
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


@router.post("/generate-insight")
async def generate_insight(req: CopilotInsightRequest) -> StreamingResponse:
    async def event_stream():
        async for event in copilot_service.generate_single_insight(
            prompt=req.prompt,
            dataset_id=req.dataset_id,
            focus_area=req.focus_area,
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
