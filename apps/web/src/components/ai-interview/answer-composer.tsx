"use client";

import { AudioLines, Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { useT } from "@/i18n";

interface AnswerComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled: boolean;
  speechSupported: boolean;
  listening: boolean;
  interim: string;
  speechError: string | null;
  onToggleListening: () => void;
}

/**
 * Answer input. Speech fills the draft; typing is always available.
 * The draft is sent as one answer when the candidate presses Send.
 */
export function AnswerComposer({
  draft,
  onDraftChange,
  onSubmit,
  submitting,
  disabled,
  speechSupported,
  listening,
  interim,
  speechError,
  onToggleListening,
}: AnswerComposerProps) {
  const t = useT();
  const canSend = !disabled && !submitting && draft.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 border-t border-border p-4">
      {listening && (
        <div
          className="flex w-fit items-center gap-3 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-sm text-slate-700"
          role="status"
        >
          <AudioLines className="size-5 animate-pulse text-primary" aria-hidden />
          <span>{t("trainee.aiInterview.listening", "Listening...") || "Listening..."}</span>
          {interim && <span className="max-w-xs truncate text-muted-foreground">{interim}</span>}
        </div>
      )}

      {speechError && <p className="text-xs text-amber-700">{speechError}</p>}

      <div className="flex w-full items-end gap-2">
        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && canSend) {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled || submitting}
          placeholder={
            disabled
              ? t("trainee.aiInterview.placeholderEnded", "Interview ended") || "Interview ended"
              : t("trainee.aiInterview.placeholderType", "Type your answer... (Ctrl+Enter to send)") || "Type your answer... (Ctrl+Enter to send)"
          }
          aria-label={t("trainee.aiInterview.answerLabel", "Your answer") || "Your answer"}
          rows={2}
          className="flex-1 min-w-0 w-full resize-none bg-background min-h-10"
        />
        {speechSupported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggleListening}
            disabled={disabled || submitting}
            aria-pressed={listening}
            aria-label={
              listening
                ? t("trainee.aiInterview.stopListening", "Stop listening") || "Stop listening"
                : t("trainee.aiInterview.speakAnswer", "Speak answer") || "Speak answer"
            }
            className={cn("shrink-0", listening && "border-primary text-primary")}
          >
            {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
          </Button>
        )}
        <Button type="button" onClick={onSubmit} disabled={!canSend} className="shrink-0 gap-2">
          <Send className="size-4" aria-hidden />
          {submitting
            ? t("trainee.aiInterview.sending", "Sending...") || "Sending..."
            : t("trainee.aiInterview.sendAnswer", "Send Answer") || "Send Answer"}
        </Button>
      </div>

      {!speechSupported && (
        <p className="text-xs text-muted-foreground">
          {t("trainee.aiInterview.voiceUnsupported", "Voice input is not supported in this browser.") ||
            "Voice input is not supported in this browser."}
        </p>
      )}
    </div>
  );
}
