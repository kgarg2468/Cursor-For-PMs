import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.models.database import get_db
from app.models.schemas import (
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
    SendMessageRequest,
    CreateConversationRequest,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


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
