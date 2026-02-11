import { create } from "zustand";
import type {
  ConversationResponse,
  MessageResponse,
} from "@/lib/api";

interface ChatState {
  conversations: ConversationResponse[];
  activeConversationId: string | null;
  messages: MessageResponse[];
  pinnedCards: string[];
  isStreaming: boolean;
  thinkingSteps: string[];
  draftMessage: string;

  setConversations: (conversations: ConversationResponse[]) => void;
  addConversation: (conversation: ConversationResponse) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (messages: MessageResponse[]) => void;
  addMessage: (message: MessageResponse) => void;
  updateLastAssistantMessage: (content: string) => void;
  pinCard: (cardId: string) => void;
  unpinCard: (cardId: string) => void;
  clearPinnedCards: () => void;
  setIsStreaming: (streaming: boolean) => void;
  addThinkingStep: (step: string) => void;
  clearThinkingSteps: () => void;
  removeLastMessage: () => void;
  setDraftMessage: (message: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  pinnedCards: [],
  isStreaming: false,
  thinkingSteps: [],
  draftMessage: "",

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      }
      return { messages: msgs };
    }),
  pinCard: (cardId) =>
    set((state) => ({
      pinnedCards: state.pinnedCards.includes(cardId)
        ? state.pinnedCards
        : [...state.pinnedCards, cardId],
    })),
  unpinCard: (cardId) =>
    set((state) => ({
      pinnedCards: state.pinnedCards.filter((id) => id !== cardId),
    })),
  clearPinnedCards: () => set({ pinnedCards: [] }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  addThinkingStep: (step) =>
    set((state) => ({ thinkingSteps: [...state.thinkingSteps, step] })),
  clearThinkingSteps: () => set({ thinkingSteps: [] }),
  removeLastMessage: () =>
    set((state) => ({ messages: state.messages.slice(0, -1) })),
  setDraftMessage: (message) => set({ draftMessage: message }),
}));
