import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Plus,
  Sparkles,
  ArrowUp,
  Square,
  Copy,
  Check,
  ChevronDown,
  Pin,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";
import { useChatStore } from "@/stores/chatStore";
import { useInsightStore } from "@/stores/insightStore";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

/* ---------- MarkdownContent ---------- */
const MarkdownContent = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => (
        <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-base font-semibold mb-1.5 mt-2.5">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>
      ),
      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
      ul: ({ children }) => (
        <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
      ),
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
      ),
      code: ({ className, children }) => {
        const isBlock = className?.includes("language-");
        if (isBlock) {
          return (
            <pre className="bg-muted rounded-md p-3 my-2 overflow-x-auto text-xs">
              <code>{children}</code>
            </pre>
          );
        }
        return (
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            {children}
          </code>
        );
      },
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
          {children}
        </blockquote>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full text-xs border border-border rounded">
            {children}
          </table>
        </div>
      ),
      th: ({ children }) => (
        <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-border px-2 py-1">{children}</td>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

/* ---------- ThinkingSection ---------- */
const ThinkingSection = ({
  steps,
  isStreaming,
}: {
  steps: string[];
  isStreaming: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [wasStreaming, setWasStreaming] = useState(false);

  // Auto-open when streaming starts (React-recommended derived state pattern)
  if (isStreaming && !wasStreaming) {
    setWasStreaming(true);
    setIsOpen(true);
  }
  if (!isStreaming && wasStreaming) {
    setWasStreaming(false);
  }

  if (steps.length === 0) return null;

  const combinedText = steps.join("");

  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isStreaming ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Thinking...
          </>
        ) : (
          <>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                !isOpen && "-rotate-90"
              )}
            />
            Thought process
          </>
        )}
      </button>
      {isOpen && (
        <div className="mt-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border/50 max-h-40 overflow-y-auto whitespace-pre-wrap">
          {combinedText}
        </div>
      )}
    </div>
  );
};

/* ---------- MessageBubble ---------- */
const MessageBubble = ({
  role,
  content,
  isLast,
  isStreaming,
}: {
  role: "user" | "assistant";
  content: string;
  isLast: boolean;
  isStreaming: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%] text-sm">
          {content}
        </div>
      </div>
    );
  }

  const showCursor = isLast && isStreaming && content.length > 0;
  const showLoading = isLast && isStreaming && content.length === 0;

  return (
    <div className="flex gap-2.5 group">
      <div className="shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mt-0.5">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        {showLoading ? (
          <div className="flex items-center gap-1 py-2">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
          </div>
        ) : (
          <div className="text-sm prose-sm">
            <MarkdownContent content={content} />
            {showCursor && (
              <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}
        {!isStreaming && content.length > 0 && (
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- EmptyState ---------- */
const SUGGESTED_PROMPTS = [
  { label: "Summarize my data", prompt: "Give me a comprehensive summary of my dataset — key metrics, notable patterns, and anything that stands out." },
  { label: "Find churn risks", prompt: "Identify accounts that are at high risk of churning and explain the warning signs." },
  { label: "Revenue opportunities", prompt: "Find the biggest revenue growth opportunities in my data and recommend specific actions." },
  { label: "Compare segments", prompt: "Compare different customer segments in the data and highlight meaningful differences." },
];

const EmptyState = ({ onSend }: { onSend: (prompt: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-4">
    <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mb-4">
      <Sparkles className="h-5 w-5 text-primary" />
    </div>
    <h3 className="text-sm font-medium mb-1">Ask anything about your data</h3>
    <p className="text-xs text-muted-foreground mb-6 text-center">
      Pin insight cards for context, or try a prompt below.
    </p>
    <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
      {SUGGESTED_PROMPTS.map((sp) => (
        <button
          key={sp.label}
          onClick={() => onSend(sp.prompt)}
          className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors"
        >
          {sp.label}
        </button>
      ))}
    </div>
  </div>
);

/* ---------- ChatInput ---------- */
const ChatInput = ({
  onSend,
  onStop,
  isStreaming,
  draftMessage,
  clearDraft,
}: {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  draftMessage: string;
  clearDraft: () => void;
}) => {
  const [value, setValue] = useState(draftMessage || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prevDraft, setPrevDraft] = useState(draftMessage);

  // Inject draft message (React-recommended derived state pattern)
  if (draftMessage !== prevDraft) {
    setPrevDraft(draftMessage);
    if (draftMessage) {
      setValue(draftMessage);
      clearDraft();
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim());
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-3">
      {isStreaming && (
        <div className="flex justify-center mb-2">
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary hover:bg-accent border border-border rounded-full px-3 py-1.5 transition-colors"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop generating
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask about your data..."
          className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none min-h-[36px]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          size="icon"
          className="shrink-0 h-9 w-9 rounded-lg"
          disabled={!value.trim() || isStreaming}
          onClick={handleSend}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
        Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

/* ---------- PinnedContext ---------- */
const PinnedContext = ({
  pinnedCards,
  onUnpin,
}: {
  pinnedCards: string[];
  onUnpin: (id: string) => void;
}) => {
  const insights = useInsightStore((s) => s.insights);

  if (pinnedCards.length === 0) return null;

  return (
    <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1.5">
      {pinnedCards.map((cardId) => {
        const insight = insights.find((i) => i.id === cardId);
        const label = insight
          ? insight.title.length > 30
            ? insight.title.slice(0, 30) + "..."
            : insight.title
          : cardId.slice(0, 8) + "...";
        return (
          <button
            key={cardId}
            onClick={() => onUnpin(cardId)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary border border-border hover:border-destructive/50 hover:bg-destructive/10 transition-colors"
          >
            <Pin className="h-3 w-3 text-primary" />
            <span className="truncate max-w-[120px]">{label}</span>
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
};

/* ---------- Main SidePanel ---------- */
export const SidePanel = () => {
  const {
    sidePanelOpen,
    sidePanelExpanded,
    setSidePanelOpen,
    toggleSidePanelExpanded,
  } = useAppStore();

  const { pinnedCards, unpinCard, draftMessage, setDraftMessage } =
    useChatStore();

  const {
    messages,
    isStreaming,
    thinkingSteps,
    sendMessage,
    stopGenerating,
    newConversation,
    shouldAutoScrollRef,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (shouldAutoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingSteps, isStreaming, shouldAutoScrollRef]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distFromBottom < 50;
  }, [shouldAutoScrollRef]);

  if (!sidePanelOpen) return null;

  return (
    <div
      className={cn(
        "border-l border-border bg-card flex flex-col h-full transition-all duration-200",
        sidePanelExpanded ? "absolute inset-0 z-50" : "w-[400px] shrink-0"
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium flex-1">AI Chat</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={newConversation}
          title="New conversation"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={toggleSidePanelExpanded}
        >
          {sidePanelExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSidePanelOpen(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Pinned Context */}
      <PinnedContext pinnedCards={pinnedCards} onUnpin={unpinCard} />

      {/* Messages */}
      {messages.length === 0 && !isStreaming ? (
        <div className="flex-1 overflow-hidden">
          <EmptyState onSend={sendMessage} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3"
          onScroll={handleScroll}
        >
          <div className="py-4 space-y-4">
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === "assistant" && idx === messages.length - 1;
              return (
                <div key={msg.id}>
                  {/* Show thinking above the last assistant message */}
                  {isLastAssistant && thinkingSteps.length > 0 && (
                    <ThinkingSection
                      steps={thinkingSteps}
                      isStreaming={isStreaming}
                    />
                  )}
                  <MessageBubble
                    role={msg.role as "user" | "assistant"}
                    content={msg.content}
                    isLast={isLastAssistant}
                    isStreaming={isStreaming}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopGenerating}
        isStreaming={isStreaming}
        draftMessage={draftMessage}
        clearDraft={() => setDraftMessage("")}
      />
    </div>
  );
};
