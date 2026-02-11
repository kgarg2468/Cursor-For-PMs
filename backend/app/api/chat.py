import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.database import get_db
from app.models.schemas import (
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
    SendMessageRequest,
    CreateConversationRequest,
)
from app.services import claude_client, data_processor

router = APIRouter(prefix="/api/chat", tags=["chat"])

CHAT_SYSTEM_PROMPT = """You are an expert product analytics AI assistant embedded in a product intelligence platform. Your role is to help product managers understand their data, find insights, and make data-driven decisions.

Guidelines:
- Be professional but approachable — like a sharp data analyst colleague
- Always cite specific numbers and metrics from the data when available
- Use markdown formatting: headers, bold for emphasis, bullet lists, tables when comparing data
- When referencing pinned insights, acknowledge them by name and build on their findings
- Keep responses focused and actionable — PMs are busy
- If you don't have enough data to answer confidently, say so
- Suggest follow-up questions when appropriate

{dataset_context}

{pinned_context}"""


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(req: CreateConversationRequest) -> ConversationResponse:
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (conv_id, req.title or "New Conversation", now, now),
        )
        await db.commit()
    finally:
        await db.close()
    return ConversationResponse(id=conv_id, title=req.title or "New Conversation", created_at=now, updated_at=now)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations() -> list[ConversationResponse]:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
        rows = await cursor.fetchall()
        return [
            ConversationResponse(id=row[0], title=row[1], created_at=row[2], updated_at=row[3])
            for row in rows
        ]
    finally:
        await db.close()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: str) -> ConversationDetailResponse:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?", (conversation_id,))
        conv = await cursor.fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        msg_cursor = await db.execute(
            "SELECT id, conversation_id, role, content, thinking, pinned_context, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,),
        )
        msg_rows = await msg_cursor.fetchall()
        messages = [
            MessageResponse(
                id=r[0],
                conversation_id=r[1],
                role=r[2],
                content=r[3],
                thinking=json.loads(r[4]) if r[4] else None,
                pinned_context=json.loads(r[5]) if r[5] else None,
                created_at=r[6],
            )
            for r in msg_rows
        ]

        return ConversationDetailResponse(
            id=conv[0], title=conv[1], created_at=conv[2], updated_at=conv[3], messages=messages
        )
    finally:
        await db.close()


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(conversation_id: str, req: SendMessageRequest) -> MessageResponse:
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM conversations WHERE id = ?", (conversation_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Conversation not found")

        await db.execute(
            "INSERT INTO messages (id, conversation_id, role, content, pinned_context, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (msg_id, conversation_id, "user", req.content, json.dumps(req.pinned_context) if req.pinned_context else None, now),
        )
        await db.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, conversation_id))
        await db.commit()
    finally:
        await db.close()

    return MessageResponse(
        id=msg_id,
        conversation_id=conversation_id,
        role="user",
        content=req.content,
        pinned_context=req.pinned_context,
        created_at=now,
    )


@router.post("/conversations/{conversation_id}/stream")
async def stream_chat(conversation_id: str, req: SendMessageRequest) -> StreamingResponse:
    """Stream an AI chat response via SSE."""

    async def event_generator():
        db = await get_db()
        try:
            # Verify conversation exists
            cursor = await db.execute("SELECT id FROM conversations WHERE id = ?", (conversation_id,))
            if not await cursor.fetchone():
                yield f"data: {json.dumps({'type': 'error', 'data': {'message': 'Conversation not found'}})}\n\n"
                return

            # Save user message
            user_msg_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            await db.execute(
                "INSERT INTO messages (id, conversation_id, role, content, pinned_context, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_msg_id, conversation_id, "user", req.content,
                 json.dumps(req.pinned_context) if req.pinned_context else None, now),
            )
            await db.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, conversation_id))
            await db.commit()

            # Load conversation history (last 20 messages)
            msg_cursor = await db.execute(
                "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
                (conversation_id,),
            )
            msg_rows = await msg_cursor.fetchall()
            # Take last 20 messages for context
            recent = msg_rows[-20:] if len(msg_rows) > 20 else msg_rows
            messages = [{"role": r[0], "content": r[1]} for r in recent]

            # Resolve pinned context — look up insight details
            pinned_text = ""
            if req.pinned_context:
                insight_parts = []
                for insight_id in req.pinned_context:
                    ic = await db.execute(
                        "SELECT title, description, type, impact_score, impact_revenue, impact_customers FROM insights WHERE id = ?",
                        (insight_id,),
                    )
                    row = await ic.fetchone()
                    if row:
                        insight_parts.append(
                            f"- **{row[0]}** ({row[2]}, score: {row[3]}): {row[1]}"
                            + (f" | Revenue impact: ${row[4]:,.0f}" if row[4] else "")
                            + (f" | Customers affected: {row[5]}" if row[5] else "")
                        )
                if insight_parts:
                    pinned_text = "The user has pinned the following insights for context:\n" + "\n".join(insight_parts)

            # Get dataset context
            dataset_context = ""
            dataset_id = None

            # Try to get dataset_id from a pinned insight
            if req.pinned_context:
                for insight_id in req.pinned_context:
                    dc = await db.execute("SELECT dataset_id FROM insights WHERE id = ?", (insight_id,))
                    drow = await dc.fetchone()
                    if drow:
                        dataset_id = drow[0]
                        break

            # Fallback to latest dataset
            if not dataset_id:
                dc = await db.execute("SELECT id FROM datasets ORDER BY created_at DESC LIMIT 1")
                drow = await dc.fetchone()
                if drow:
                    dataset_id = drow[0]

            if dataset_id:
                try:
                    summary = await data_processor.get_dataset_summary(dataset_id)
                    dataset_context = (
                        f"Dataset summary ({summary['row_count']} rows):\n"
                        f"Columns: {', '.join(c['name'] + ' (' + c['dtype'] + ')' for c in summary['columns'])}\n"
                        f"Numeric stats: {json.dumps(summary['numeric_stats'], indent=2)}\n"
                        f"Categorical counts: {json.dumps(summary['categorical_counts'], indent=2)}"
                    )
                except Exception:
                    dataset_context = "No dataset summary available."
        finally:
            await db.close()

        # Build system prompt
        system_prompt = CHAT_SYSTEM_PROMPT.format(
            dataset_context=f"## Current Dataset\n{dataset_context}" if dataset_context else "",
            pinned_context=f"## Pinned Insights\n{pinned_text}" if pinned_text else "",
        )

        # Stream Claude response
        thinking_chunks: list[str] = []
        text_content = ""
        try:
            async for event in claude_client.stream_chat(system_prompt, messages, budget_tokens=2000):
                if event["type"] == "thinking":
                    chunk = event["content"]
                    if chunk:
                        thinking_chunks.append(chunk)
                        # Yield thinking in ~100 char batches
                        yield f"data: {json.dumps({'type': 'thinking', 'data': {'content': chunk}})}\n\n"
                elif event["type"] == "text_start":
                    yield f"data: {json.dumps({'type': 'text_start', 'data': {}})}\n\n"
                elif event["type"] == "text":
                    text_content += event["content"]
                    yield f"data: {json.dumps({'type': 'text', 'data': {'content': event['content']}})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'data': {'message': str(e)}})}\n\n"
            return

        # Save assistant message to DB
        assistant_msg_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        db = await get_db()
        try:
            await db.execute(
                "INSERT INTO messages (id, conversation_id, role, content, thinking, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (assistant_msg_id, conversation_id, "assistant", text_content,
                 json.dumps(thinking_chunks) if thinking_chunks else None, now),
            )
            await db.commit()
        finally:
            await db.close()

        yield f"data: {json.dumps({'type': 'complete', 'data': {'message_id': assistant_msg_id}})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str) -> dict[str, str]:
    db = await get_db()
    try:
        await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
        await db.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        await db.commit()
    finally:
        await db.close()
    return {"status": "deleted"}
