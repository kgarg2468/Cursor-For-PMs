import { useCallback, useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useActivityFeedStore } from "@/stores/activityFeedStore";
import { mapChatEvent } from "@/lib/activityMappers";
import { chatApi } from "@/lib/api";
import { connectPostSSE, type SSEConnection } from "@/lib/sse";

export function useChat() {
  const {
    activeConversationId,
    messages,
    pinnedCards,
    isStreaming,
    thinkingSteps,
    setActiveConversationId,
    addConversation,
    addMessage,
    updateLastAssistantMessage,
    removeLastMessage,
    setMessages,
    setIsStreaming,
    addThinkingStep,
    clearThinkingSteps,
  } = useChatStore();

  const connectionRef = useRef<SSEConnection | null>(null);
  const textBufferRef = useRef("");
  const shouldAutoScrollRef = useRef(true);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      let conversationId = activeConversationId;

      // Create conversation if needed
      if (!conversationId) {
        try {
          const conv = await chatApi.createConversation(trimmed.slice(0, 50));
          addConversation(conv);
          setActiveConversationId(conv.id);
          conversationId = conv.id;
        } catch {
          return;
        }
      }

      // Optimistically add user message
      const userMsgId = `temp-user-${Date.now()}`;
      addMessage({
        id: userMsgId,
        conversation_id: conversationId,
        role: "user",
        content: trimmed,
        thinking: null,
        pinned_context: pinnedCards.length > 0 ? pinnedCards : null,
        created_at: new Date().toISOString(),
      });

      // Add placeholder assistant message
      const assistantMsgId = `temp-assistant-${Date.now()}`;
      addMessage({
        id: assistantMsgId,
        conversation_id: conversationId,
        role: "assistant",
        content: "",
        thinking: null,
        pinned_context: null,
        created_at: new Date().toISOString(),
      });

      setIsStreaming(true);
      clearThinkingSteps();
      textBufferRef.current = "";
      shouldAutoScrollRef.current = true;

      // Start chat activity feed
      useActivityFeedStore.getState().startFeed("chat", conversationId);

      const url = chatApi.streamUrl(conversationId);
      const body = chatApi.streamBody(trimmed, pinnedCards.length > 0 ? pinnedCards : undefined);

      connectionRef.current = connectPostSSE(
        url,
        (event) => {
          // Activity feed mapper
          mapChatEvent(event as { type: string; data: Record<string, unknown> }, useActivityFeedStore.getState());

          switch (event.type) {
            case "thinking":
              if (event.data.content) {
                addThinkingStep(event.data.content as string);
              }
              break;
            case "text_start":
              // Text stream beginning — noop
              break;
            case "text":
              textBufferRef.current += event.data.content as string;
              updateLastAssistantMessage(textBufferRef.current);
              break;
            case "complete":
              setIsStreaming(false);
              connectionRef.current = null;
              break;
            case "error":
              updateLastAssistantMessage(
                `Error: ${(event.data.message as string) || "Something went wrong."}`
              );
              setIsStreaming(false);
              connectionRef.current = null;
              break;
          }
        },
        () => {
          // onError
          setIsStreaming(false);
          connectionRef.current = null;
        },
        () => {
          // onComplete
          setIsStreaming(false);
          connectionRef.current = null;
        },
        body
      );
    },
    [
      activeConversationId,
      isStreaming,
      pinnedCards,
      addConversation,
      setActiveConversationId,
      addMessage,
      updateLastAssistantMessage,
      setIsStreaming,
      addThinkingStep,
      clearThinkingSteps,
    ]
  );

  const stopGenerating = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsStreaming(false);
    // If the last assistant message is empty, remove it
    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    if (last && last.role === "assistant" && !last.content) {
      removeLastMessage();
    }
  }, [setIsStreaming, removeLastMessage]);

  const newConversation = useCallback(async () => {
    // Stop any active stream
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsStreaming(false);

    try {
      const conv = await chatApi.createConversation();
      addConversation(conv);
      setActiveConversationId(conv.id);
      setMessages([]);
      clearThinkingSteps();
    } catch {
      // Fallback: just clear local state
      setActiveConversationId(null);
      setMessages([]);
      clearThinkingSteps();
    }
  }, [setIsStreaming, addConversation, setActiveConversationId, setMessages, clearThinkingSteps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    thinkingSteps,
    sendMessage,
    stopGenerating,
    newConversation,
    shouldAutoScrollRef,
  };
}
