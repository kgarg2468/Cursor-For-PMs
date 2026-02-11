import { useState, useRef, useEffect } from "react";
import { X, Maximize2, Minimize2, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";

export const SidePanel = () => {
  const {
    sidePanelOpen,
    sidePanelExpanded,
    setSidePanelOpen,
    toggleSidePanelExpanded,
  } = useAppStore();

  const { pinnedCards, unpinCard, messages, thinkingSteps, isStreaming, draftMessage, setDraftMessage } =
    useChatStore();

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (draftMessage) {
      setInputValue(draftMessage);
      setDraftMessage("");
      inputRef.current?.focus();
    }
  }, [draftMessage, setDraftMessage]);

  if (!sidePanelOpen) return null;

  return (
    <div
      className={cn(
        "border-l border-border bg-card flex flex-col h-full transition-all duration-200",
        sidePanelExpanded ? "absolute inset-0 z-50" : "w-[400px] shrink-0"
      )}
    >
      {/* Panel Header */}
      <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1">AI Chat</span>
        <Button variant="ghost" size="icon" className="h-7 w-7">
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

      {/* Pinned Context Chips */}
      {pinnedCards.length > 0 && (
        <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1.5">
          {pinnedCards.map((cardId) => (
            <Badge
              key={cardId}
              variant="secondary"
              className="gap-1 text-xs cursor-pointer"
              onClick={() => unpinCard(cardId)}
            >
              📌 {cardId.slice(0, 8)}...
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center text-muted-foreground text-sm py-12">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Ask anything about your data.</p>
              <p className="text-xs mt-1">
                Pin insight cards for context, or use @mentions.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "text-sm",
                msg.role === "user"
                  ? "bg-secondary rounded-lg px-3 py-2 ml-8"
                  : "pr-8"
              )}
            >
              {msg.content}
            </div>
          ))}

          {/* Thinking Steps */}
          {isStreaming && thinkingSteps.length > 0 && (
            <div className="space-y-1.5">
              {thinkingSteps.map((step, i) => (
                <div
                  key={i}
                  className="text-xs text-muted-foreground bg-muted/50 rounded px-2.5 py-1.5 border border-border/50"
                >
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about your data..."
            className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button size="sm" className="shrink-0">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
