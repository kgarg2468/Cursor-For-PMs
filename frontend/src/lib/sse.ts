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
