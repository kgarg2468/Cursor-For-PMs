export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

export type SSEEventHandler = (event: SSEEvent) => void;

export interface SSEConnection {
  close: () => void;
}

export function connectSSE(
  url: string,
  onEvent: SSEEventHandler,
  onError?: (error: Error) => void,
  onComplete?: () => void
): SSEConnection {
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as SSEEvent;
      onEvent(parsed);

      if (parsed.type === "complete" || parsed.type === "error") {
        eventSource.close();
        if (parsed.type === "error" && onError) {
          onError(new Error((parsed.data.message as string) || "Stream error"));
        }
        if (parsed.type === "complete" && onComplete) {
          onComplete();
        }
      }
    } catch {
      // Ignore parse errors for non-JSON messages
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    if (onError) {
      onError(new Error("SSE connection failed"));
    }
  };

  return {
    close: () => eventSource.close(),
  };
}

/**
 * Connect to an SSE endpoint using POST (fetch-based streaming).
 * EventSource only supports GET, so we use fetch + ReadableStream for POST endpoints.
 */
export function connectPostSSE(
  url: string,
  onEvent: SSEEventHandler,
  onError?: (error: Error) => void,
  onComplete?: () => void,
  body?: Record<string, unknown>
): SSEConnection {
  const controller = new AbortController();

  (async () => {
    try {
      const headers: Record<string, string> = { "Accept": "text/event-stream" };
      if (body) {
        headers["Content-Type"] = "application/json";
      }
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error((err as { detail?: string }).detail || "Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr) as SSEEvent;
            onEvent(parsed);

            if (parsed.type === "complete") {
              onComplete?.();
            } else if (parsed.type === "error") {
              onError?.(new Error((parsed.data.message as string) || "Stream error"));
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6)) as SSEEvent;
          onEvent(parsed);
          if (parsed.type === "complete") onComplete?.();
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError?.(err instanceof Error ? err : new Error("SSE connection failed"));
      }
    }
  })();

  return {
    close: () => controller.abort(),
  };
}
