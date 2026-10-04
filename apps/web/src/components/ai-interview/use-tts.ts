"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeNoop(): () => void {
  return () => {};
}

function hasSpeechSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Clean text for speech synthesis by stripping markdown formatting and excess whitespace. */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*_#`~>]/g, "") // strip markdown symbols
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace [link](url) with link
    .replace(/\s+/g, " ")
    .trim();
}

export interface TTSState {
  supported: boolean;
  speaking: boolean;
  muted: boolean;
  speak: (text: string, force?: boolean) => void;
  stop: () => void;
  toggleMute: () => void;
  replay: (text: string) => void;
}

export function useTTS(): TTSState {
  const supported = useSyncExternalStore(
    subscribeNoop,
    () => hasSpeechSynthesis(),
    () => false,
  );

  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Initialize voice selection
  useEffect(() => {
    if (!supported) return;

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer standard clear English voices (Google, Natural, en-IN, en-GB, en-US)
      const preferred =
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        voices.find((v) => v.name.includes("Natural") && v.lang.startsWith("en")) ||
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang.startsWith("en"));

      selectedVoiceRef.current = preferred || voices[0] || null;
    }

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      if (hasSpeechSynthesis()) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!hasSpeechSynthesis()) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (rawText: string, force = false) => {
      if (!hasSpeechSynthesis()) return;
      if (muted && !force) return;

      const clean = cleanTextForSpeech(rawText);
      if (!clean) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      utteranceRef.current = utterance;

      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      utterance.rate = 0.95; // Slightly slower for better clarity in interviews
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpeaking(true);
      };

      utterance.onend = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };

      utterance.onerror = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next && hasSpeechSynthesis()) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      return next;
    });
  }, []);

  const replay = useCallback(
    (text: string) => {
      if (muted) setMuted(false);
      speak(text, true);
    },
    [muted, speak],
  );

  return {
    supported,
    speaking,
    muted,
    speak,
    stop,
    toggleMute,
    replay,
  };
}
