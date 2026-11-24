"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { AgentToolActivity, sendAgentMessage } from "@/lib/agent";

interface AIChatPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  activities?: AgentToolActivity[];
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AIChatPanel({
  projectId,
  isOpen,
  onClose,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  async function handleSend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const message = input.trim();

    if (!message || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await sendAgentMessage(projectId, message);

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: response.message,
        activities: response.activities,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: createMessageId(),
        role: "error",
        content:
          error instanceof Error
            ? error.message
            : "Something went wrong while contacting Forge AI.",
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <aside
      className={`${isOpen ? "flex" : "hidden"} "flex h-full w-[380px] max-w-[45vw] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950"`}
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-300">
            ✦
          </div>

          <div>
            <div className="text-sm font-medium text-zinc-100">Forge AI</div>
            <div className="text-[10px] text-zinc-500">AI coding assistant</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI assistant"
          className="rounded-md px-2 py-1 text-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-2xl text-violet-300">
              ✦
            </div>

            <h2 className="text-base font-medium text-zinc-100">
              Build with Forge AI
            </h2>

            <p className="mt-2 max-w-[260px] text-xs leading-5 text-zinc-500">
              Ask questions about your project, inspect files, or ask Forge AI
              to make changes to your code.
            </p>

            <div className="mt-6 w-full space-y-2">
              {[
                "Explain my project structure",
                "Read my package.json",
                "Create a simple landing page",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-left text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            const isError = message.role === "error";

            return (
              <div
                key={message.id}
                className={`flex w-full ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-xl px-3 py-2.5 ${
                    isUser
                      ? "bg-violet-600 text-white"
                      : isError
                        ? "border border-red-500/20 bg-red-500/10 text-red-300"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-200"
                  }`}
                >
                  {!isUser && (
                    <div
                      className={`mb-1.5 text-[10px] font-semibold ${
                        isError ? "text-red-400" : "text-violet-300"
                      }`}
                    >
                      {isError ? "ERROR" : "FORGE AI"}
                    </div>
                  )}
                  {message.role === "assistant" &&
                    message.activities &&
                    message.activities.length > 0 && (
                      <div className="mb-3 space-y-2 border-b border-zinc-700/70 pb-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Agent activity
                        </div>

                        {message.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            {activity.status === "completed" ? (
                              <span className="text-emerald-400">✓</span>
                            ) : activity.status === "failed" ? (
                              <span className="text-red-400">✕</span>
                            ) : (
                              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                            )}

                            <span
                              className={
                                activity.status === "failed"
                                  ? "text-red-300"
                                  : "text-zinc-400"
                              }
                            >
                              {activity.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  <div className="whitespace-pre-wrap break-words text-xs leading-6">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:240ms]" />
                </span>
                Forge AI is thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <form onSubmit={handleSend}>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 transition focus-within:border-violet-500/60">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={3}
              placeholder="Ask Forge AI anything..."
              className="max-h-36 min-h-[76px] w-full resize-none bg-transparent px-3 py-3 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />

            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="text-[10px] text-zinc-600">
                Enter to send · Shift + Enter for newline
              </span>

              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "Sending..." : "Send"}
                <span aria-hidden="true">↑</span>
              </button>
            </div>
          </div>
        </form>

        <p className="mt-2 text-center text-[10px] text-zinc-600">
          Forge AI can make changes to your project files.
        </p>
      </div>
    </aside>
  );
}
