import anthropic
from collections.abc import AsyncGenerator
from app.core.config import settings


client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-opus-4-6"


async def stream_completion(
    system_prompt: str,
    user_prompt: str,
    budget_tokens: int = 2000,
    model: str | None = None,
    max_tokens: int = 16000,
) -> AsyncGenerator[dict[str, str], None]:
    """Stream a Claude response, yielding thinking and text events."""
    async with client.messages.stream(
        model=model or MODEL,
        max_tokens=max_tokens,
        thinking={
            "type": "enabled",
            "budget_tokens": budget_tokens,
        },
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for event in stream:
            if event.type == "content_block_start":
                if event.content_block.type == "thinking":
                    yield {"type": "thinking", "content": ""}
                elif event.content_block.type == "text":
                    yield {"type": "text_start", "content": ""}
            elif event.type == "content_block_delta":
                if event.delta.type == "thinking_delta":
                    yield {"type": "thinking", "content": event.delta.thinking}
                elif event.delta.type == "text_delta":
                    yield {"type": "text", "content": event.delta.text}


async def stream_chat(
    system_prompt: str,
    messages: list[dict[str, str]],
    budget_tokens: int = 2000,
) -> AsyncGenerator[dict[str, str], None]:
    """Stream a multi-turn chat response. Messages should be text-only (no thinking blocks)."""
    async with client.messages.stream(
        model=MODEL,
        max_tokens=16000,
        thinking={
            "type": "enabled",
            "budget_tokens": budget_tokens,
        },
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for event in stream:
            if event.type == "content_block_start":
                if event.content_block.type == "thinking":
                    yield {"type": "thinking", "content": ""}
                elif event.content_block.type == "text":
                    yield {"type": "text_start", "content": ""}
            elif event.type == "content_block_delta":
                if event.delta.type == "thinking_delta":
                    yield {"type": "thinking", "content": event.delta.thinking}
                elif event.delta.type == "text_delta":
                    yield {"type": "text", "content": event.delta.text}


async def complete(
    system_prompt: str,
    user_prompt: str,
    budget_tokens: int = 1000,
) -> dict[str, str]:
    """Non-streaming Claude completion. Returns {"thinking": ..., "text": ...}."""
    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        thinking={
            "type": "enabled",
            "budget_tokens": budget_tokens,
        },
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    thinking = ""
    text = ""
    for block in response.content:
        if block.type == "thinking":
            thinking += block.thinking
        elif block.type == "text":
            text += block.text

    return {"thinking": thinking, "text": text}
