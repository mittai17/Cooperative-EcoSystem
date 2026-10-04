"use client";

import { Bot, User } from "lucide-react";
import { cn } from "cn";

/** Display role: "ai" is the interviewer, "candidate" is the person being interviewed. */
export type TranscriptRole = "ai" | "candidate";

export interface TranscriptMessage {
  id: string;
  /** "welcome" is display-only and is left out of the history sent to the API. */
  kind?: "welcome";
  role: TranscriptRole;
  text: string;
  /** Optional bold first line, used by the welcome message. */
  title?: string;
}

interface TranscriptProps {
  messages: TranscriptMessage[];
  emptyMessage: string;
}

export function Transcript({ messages, emptyMessage }: TranscriptProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      role="log"
      aria-live="polite"
      aria-label="Interview transcript"
    >
      {messages.map((message) => {
        const isAi = message.role === "ai";
        return (
          <div
            key={message.id}
            className={cn("flex items-start gap-2", isAi ? "justify-start" : "justify-end")}
          >
            {isAi && (
              <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" aria-hidden />
                <span className="sr-only">AI interviewer</span>
              </span>
            )}
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                isAi
                  ? "rounded-tl-sm border border-border bg-muted/60 text-slate-800"
                  : "rounded-tr-sm bg-primary/10 text-slate-800",
              )}
            >
              {message.title && <p className="mb-1 font-semibold text-slate-900">{message.title}</p>}
              <p>{message.text}</p>
            </div>
            {!isAi && (
              <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-4" aria-hidden />
                <span className="sr-only">You</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
