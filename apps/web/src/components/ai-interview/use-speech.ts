"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Minimal shape of the (prefixed) Web Speech API we rely on. */
interface SpeechResultItem {
  readonly transcript: string;
}
interface SpeechResultEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<{ readonly isFinal: boolean; readonly 0: SpeechResultItem }>;
}
interface SpeechErrorEvent {
  readonly error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function subscribeNoop(): () => void {
  return () => {};
}

export interface SpeechState {
  supported: boolean;
  listening: boolean;
  /** Words recognised so far in the current utterance that are not final yet. */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Speech-to-text for candidate answers via the Web Speech API.
 * `onFinal` receives each finalised phrase. When the API is missing the hook
 * reports `supported: false` and the UI falls back to the text input.
 */
export function useSpeech(onFinal: (text: string) => void): SpeechState {
  // Server snapshot is `false`, so server and client markup match before hydration.
  const supported = useSyncExternalStore(
    subscribeNoop,
    () => getRecognitionCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Voice answers are not supported in this browser. Type your answer instead.");
      return;
    }
    setError(null);
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          if (text.trim()) onFinalRef.current(text.trim());
        } else {
          pending += text;
        }
      }
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access for speech recognition was blocked. Type your answer instead.");
      } else {
        setError(`Speech recognition stopped (${event.error}). Type your answer or try again.`);
      }
      setListening(false);
    };
    recognition.onend = () => {
      // Browsers end recognition after silence; the user can tap the mic again.
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setError("Speech recognition could not start. Type your answer instead.");
    }
  }, []);

  useEffect(() => {
    return () => {
      const current = recognitionRef.current;
      recognitionRef.current = null;
      current?.abort();
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}
