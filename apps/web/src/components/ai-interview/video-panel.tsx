"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Camera, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CameraStatus } from "./use-camera";

export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface VideoPanelProps {
  stream: MediaStream | null;
  cameraStatus: CameraStatus;
  cameraMessage: string | null;
  /** True while the interview is running; shows the Live pill and the End button. */
  live: boolean;
  elapsedSeconds: number;
  onEnd: () => void;
}

/**
 * The candidate's own webcam preview. The stream is attached locally only.
 */
export function VideoPanel({
  stream,
  cameraStatus,
  cameraMessage,
  live,
  elapsedSeconds,
  onEnd,
}: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.srcObject = stream;
  }, [stream]);

  const showVideo = stream !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-sm">
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Your camera preview"
            className="h-full w-full scale-x-[-1] object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
            {cameraStatus === "denied" || cameraStatus === "unavailable" || cameraStatus === "error" ? (
              <AlertTriangle className="size-8 text-amber-300" aria-hidden />
            ) : (
              <Camera className="size-8 text-slate-400" aria-hidden />
            )}
            <p className="max-w-sm text-sm">
              {cameraStatus === "requesting"
                ? "Waiting for camera permission..."
                : cameraMessage ??
                  "Your camera turns on when the interview starts. Video stays in your browser and is never uploaded."}
            </p>
          </div>
        )}

        {live && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            <span>Live</span>
            <span className="tabular-nums" aria-label={`Elapsed ${formatElapsed(elapsedSeconds)}`}>
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        )}
      </div>

      {showVideo && cameraMessage && (
        <p className="text-xs text-muted-foreground">{cameraMessage}</p>
      )}

      {live && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={onEnd}
            className="h-10 rounded-full bg-primary px-6 text-white hover:bg-primary-hover"
          >
            <Square className="fill-current" aria-hidden />
            End Interview
          </Button>
        </div>
      )}
    </div>
  );
}
