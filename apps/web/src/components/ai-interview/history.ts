import type { InterviewHistoryEntry } from "@/lib/ai-interview/common";
import type { TranscriptMessage } from "./transcript";

let messageCounter = 0;

/** Unique transcript id. Module-level counter; ids only need to be unique within a page. */
export function nextMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

/** Maps transcript messages to the backend history shape. The welcome banner is not part of the conversation. */
export function toHistory(messages: TranscriptMessage[]): InterviewHistoryEntry[] {
  return messages
    .filter((message) => message.kind !== "welcome")
    .map((message) => ({
      role: message.role === "ai" ? "interviewer" : "candidate",
      text: message.text,
    }));
}
