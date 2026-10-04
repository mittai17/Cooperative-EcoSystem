"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "live" | "denied" | "unavailable" | "error";

/** Translator for user-facing messages. Defaults to the English fallback text. */
export type CameraTranslate = (key: string, fallback?: string) => string;

const englishOnly: CameraTranslate = (_key, fallback) => fallback ?? "";

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  message: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Owns the local webcam + microphone stream for the mock interview.
 * The stream is only rendered in a <video> element; it is never uploaded.
 * Tracks are stopped by `stop()` and on unmount.
 */
export function useCamera(translate: CameraTranslate = englishOnly): CameraState {
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async () => {
    stop();
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setMessage(translate("trainee.aiInterview.camUnsupported", "This browser cannot access a camera. You can still answer by typing."));
      return;
    }
    setStatus("requesting");
    setMessage(null);
    try {
      const next = await mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = next;
      setStream(next);
      setStatus("live");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setMessage(
          translate(
            "trainee.aiInterview.camDenied",
            "Camera or microphone permission was denied. Allow access in your browser settings and restart the interview, or continue by typing your answers.",
          ),
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setStatus("unavailable");
        setMessage(translate("trainee.aiInterview.camNotFound", "No camera or microphone was found. You can still answer by typing."));
      } else {
        setStatus("error");
        setMessage(translate("trainee.aiInterview.camError", "The camera could not be started. You can still answer by typing."));
      }
    }
  }, [stop, translate]);

  useEffect(() => stop, [stop]);

  return { status, stream, message, start, stop };
}
