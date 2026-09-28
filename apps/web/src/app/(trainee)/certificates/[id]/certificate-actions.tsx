"use client";

import { useState } from "react";
import { Check, Copy, Link2, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

interface CertificateActionsProps {
  certificateId: string;
  holderName: string;
  programmeTitle: string;
  verificationUrl: string;
}

/**
 * Clipboard writes are unreliable across browsers and insecure origins, so the
 * copy path has a DOM fallback and, failing that, leaves a selectable field
 * with the URL already in it rather than reporting a silent success.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}

export function CertificateActions({
  certificateId,
  holderName,
  programmeTitle,
  verificationUrl,
}: CertificateActionsProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [shareNote, setShareNote] = useState<string | null>(null);

  const handleCopy = async () => {
    const copied = await writeToClipboard(verificationUrl);
    setCopyState(copied ? "copied" : "failed");
    setShareNote(null);
  };

  const handleShare = async () => {
    const payload = {
      title: `Certificate ${certificateId}`,
      text: `${holderName} - ${programmeTitle}`,
      url: verificationUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        setShareNote("Shared.");
        setCopyState("idle");
        return;
      } catch (error) {
        // AbortError means the operator closed the sheet; that is not a failure.
        if (error instanceof DOMException && error.name === "AbortError") {
          setShareNote(null);
          return;
        }
      }
    }

    const copied = await writeToClipboard(verificationUrl);
    setCopyState(copied ? "copied" : "failed");
    setShareNote(
      copied
        ? "This browser cannot open a share sheet, so the verification link was copied instead."
        : "This browser blocked both the share sheet and the clipboard. Copy the link below.",
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" className="min-h-11" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print certificate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            void handleCopy();
          }}
        >
          {copyState === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copyState === "copied" ? "Link copied" : "Copy verification link"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            void handleShare();
          }}
        >
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="verification-url" className="flex items-center gap-1.5">
          <Link2 className="size-3.5" />
          Public verification link
        </Label>
        <Input
          id="verification-url"
          readOnly
          value={verificationUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono text-xs"
        />
        <p
          className={cn(
            "text-xs",
            copyState === "failed" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {copyState === "failed"
            ? "The clipboard was blocked. Select the link above and copy it manually."
            : "Anyone with this link can open the public verification page for this certificate."}
        </p>
        {shareNote && <p className="text-xs text-muted-foreground">{shareNote}</p>}
      </div>
    </div>
  );
}
