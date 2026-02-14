import anthropic
from collections.abc import AsyncGenerator
from app.core.config import settings


client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-opus-4-6"


def _supports_adaptive_thinking(model: str) -> bool:
    """Adaptive thinking is only supported on Opus 4.x, not Sonnet."""
    return "opus" in model.lower() and "4" in model


async def stream_completion(
    system_prompt: str,
    user_prompt: str,
    budget_tokens: int = 2000,
    model: str | None = None,
    max_tokens: int = 16000,
    use_thinking: bool | None = None,
) -> AsyncGenerator[dict[str, str], None]:
    """Stream a Claude response, yielding thinking and text events.
    If use_thinking is None, it is enabled only for models that support adaptive thinking (e.g. Opus 4)."""
    resolved_model = model or MODEL
    if use_thinking is None:
        use_thinking = _supports_adaptive_thinking(resolved_model)
    stream_kw: dict = {
        "model": resolved_model,
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }
    if use_thinking:
        stream_kw["thinking"] = {"type": "adaptive"}
    async with client.messages.stream(**stream_kw) as stream:
        async for event in stream:
            if event.type == "content_block_start":
                if use_thinking and getattr(event.content_block, "type", None) == "thinking":
                    yield {"type": "thinking", "content": ""}
                elif getattr(event.content_block, "type", None) == "text":
                    yield {"type": "text_start", "content": ""}
            elif event.type == "content_block_delta":
                delta = getattr(event, "delta", None)
                if not delta:
                    continue
                if use_thinking and getattr(delta, "type", None) == "thinking_delta":
                    yield {"type": "thinking", "content": getattr(delta, "thinking", "") or ""}
                elif getattr(delta, "type", None) == "text_delta":
                    yield {"type": "text", "content": getattr(delta, "text", "") or ""}


async def stream_chat(
    system_prompt: str,
    messages: list[dict[str, str]],
    budget_tokens: int = 2000,
) -> AsyncGenerator[dict[str, str], None]:
    """Stream a multi-turn chat response. Messages should be text-only (no thinking blocks)."""
    async with client.messages.stream(
        model=MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
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
        thinking={"type": "adaptive"},
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


# Model that does not use adaptive thinking (for node-context and simulation runs)
SONNET_MODEL = "claude-sonnet-4-5-20250929"


async def complete_no_thinking(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 1024,
) -> str:
    """Non-streaming completion without adaptive thinking. Returns only text. Uses Sonnet."""
    text = ""
    async for event in stream_completion(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=SONNET_MODEL,
        max_tokens=max_tokens,
        use_thinking=False,
    ):
        if event.get("type") == "text":
            text += event.get("content", "")
    return text.strip()
