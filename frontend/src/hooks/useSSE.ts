import { useCallback, useRef } from "react";
import { connectSSE, type SSEEvent, type SSEConnection } from "@/lib/sse";

interface UseSSEOptions {
  onEvent: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useSSE({ onEvent, onError, onComplete }: UseSSEOptions) {
  const connectionRef = useRef<SSEConnection | null>(null);

  const connect = useCallback(
    (url: string) => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }

      connectionRef.current = connectSSE(url, onEvent, onError, onComplete);
    },
    [onEvent, onError, onComplete]
  );

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
  }, []);

  return { connect, disconnect };
}
