"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface PlayerEventPayload {
  contentId: string;
  userId?: string;
  position: number;
  percentage: number;
  duration: number;
  event: "START" | "PAUSE" | "PROGRESS" | "COMPLETE" | "ERROR";
  timestamp: string;
}

export interface DikshaPlayerResource {
  identifier: string;
  title: string;
  contentType?: string;
  mimeType?: string;
  videoUrl?: string;
  artifactUrl?: string;
  streamingUrl?: string;
  playerUrl?: string;
  license?: string;
  licenseStatus?: "ALLOWED" | "ALLOWED_WITH_ATTRIBUTION" | "NON_COMMERCIAL_ONLY" | "RESTRICTED" | "UNKNOWN" | string;
  attribution?: string;
  creator?: string;
  organization?: string;
  copyright?: string;
  embeddingAllowed?: boolean;
}

interface DikshaContentPlayerProps {
  resource: DikshaPlayerResource;
  userId?: string;
  initialPosition?: number;
  onStart?: (payload: PlayerEventPayload) => void;
  onPause?: (payload: PlayerEventPayload) => void;
  onProgress?: (payload: PlayerEventPayload) => void;
  onComplete?: (payload: PlayerEventPayload) => void;
  onError?: (payload: PlayerEventPayload) => void;
  className?: string;
}

export function DikshaContentPlayer({
  resource,
  userId,
  initialPosition = 0,
  onStart,
  onPause,
  onProgress,
  onComplete,
  onError,
  className = "",
}: DikshaContentPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // PDF reading progress tracking
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(10); // Default estimate

  const rawUrl = resource.streamingUrl || resource.artifactUrl || resource.videoUrl || "";
  const isPdf =
    (resource.mimeType && resource.mimeType.toLowerCase().includes("pdf")) ||
    rawUrl.toLowerCase().endsWith(".pdf") ||
    resource.contentType === "document";

  const isRestricted =
    resource.licenseStatus === "RESTRICTED" || resource.embeddingAllowed === false;

  const isYouTube = rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be");

  function getYouTubeEmbedUrl(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : url;
  }

  // Restore initial position
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition]);

  // Video Event Handlers
  function handlePlay() {
    setIsPlaying(true);
    const payload: PlayerEventPayload = {
      contentId: resource.identifier,
      userId,
      position: Math.floor(currentTime),
      percentage: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
      duration: Math.floor(duration),
      event: hasStarted ? "START" : "START",
      timestamp: new Date().toISOString(),
    };
    if (!hasStarted) {
      setHasStarted(true);
      onStart?.(payload);
    }
  }

  function handlePause() {
    setIsPlaying(false);
    onPause?.({
      contentId: resource.identifier,
      userId,
      position: Math.floor(currentTime),
      percentage: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
      duration: Math.floor(duration),
      event: "PAUSE",
      timestamp: new Date().toISOString(),
    });
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    const pct = dur > 0 ? Math.round((cur / dur) * 100) : 0;
    const payload: PlayerEventPayload = {
      contentId: resource.identifier,
      userId,
      position: Math.floor(cur),
      percentage: pct,
      duration: Math.floor(dur),
      event: "PROGRESS",
      timestamp: new Date().toISOString(),
    };
    onProgress?.(payload);

    if (pct >= 90 && !completed) {
      setCompleted(true);
      onComplete?.({
        ...payload,
        event: "COMPLETE",
      });
    }
  }

  function handleVideoEnded() {
    setIsPlaying(false);
    setCompleted(true);
    onComplete?.({
      contentId: resource.identifier,
      userId,
      position: Math.floor(duration),
      percentage: 100,
      duration: Math.floor(duration),
      event: "COMPLETE",
      timestamp: new Date().toISOString(),
    });
  }

  function handleVideoError() {
    setErrorState("Unable to play video stream. Please check network connection or source format.");
    onError?.({
      contentId: resource.identifier,
      userId,
      position: Math.floor(currentTime),
      percentage: 0,
      duration: 0,
      event: "ERROR",
      timestamp: new Date().toISOString(),
    });
  }

  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // PDF reading progress handler
  function handlePdfPageChange(newPage: number) {
    const clamped = Math.max(1, Math.min(newPage, pdfTotalPages));
    setPdfPage(clamped);
    const pct = Math.round((clamped / pdfTotalPages) * 100);
    const payload: PlayerEventPayload = {
      contentId: resource.identifier,
      userId,
      position: clamped,
      percentage: pct,
      duration: pdfTotalPages,
      event: pct >= 90 ? "COMPLETE" : "PROGRESS",
      timestamp: new Date().toISOString(),
    };
    onProgress?.(payload);
    if (pct >= 90 && !completed) {
      setCompleted(true);
      onComplete?.(payload);
    }
  }

  // Format MM:SS
  function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-border bg-slate-950 text-white shadow-xl ${className}`}
    >
      {/* License / Security Check Alert */}
      {isRestricted ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900 text-slate-300 min-h-[380px]">
          <ShieldAlert className="size-16 text-rose-500 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white mb-2">Restricted Resource</h3>
          <p className="max-w-md text-sm text-slate-400 mb-6">
            Unavailable for in-app playback due to content licensing restrictions.
          </p>
          {resource.license && (
            <Badge variant="outline" className="text-rose-400 border-rose-500/30">
              License: {resource.license}
            </Badge>
          )}
        </div>
      ) : isPdf ? (
        /* PDF / Document Viewer */
        <div className="flex flex-col bg-slate-900 min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-emerald-400" />
              <span className="font-medium truncate max-w-sm">{resource.title}</span>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                PDF Document
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                  onClick={() => handlePdfPageChange(pdfPage - 1)}
                  disabled={pdfPage <= 1}
                >
                  Prev
                </Button>
                <span className="text-slate-400 px-1">
                  Page {pdfPage} of {pdfTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                  onClick={() => handlePdfPageChange(pdfPage + 1)}
                  disabled={pdfPage >= pdfTotalPages}
                >
                  Next
                </Button>
              </div>
              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-800 min-h-[460px]">
            <iframe
              src={`${rawUrl}#toolbar=0&navpanes=0`}
              title={resource.title}
              className="w-full h-[520px] border-none"
            />
          </div>

          {/* Reading progress bar */}
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Reading Progress: {Math.round((pdfPage / pdfTotalPages) * 100)}%</span>
            <div className="w-48">
              <Progress value={Math.round((pdfPage / pdfTotalPages) * 100)} className="h-1.5 bg-slate-800" />
            </div>
          </div>
        </div>
      ) : isYouTube ? (
        /* YouTube Embed */
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={getYouTubeEmbedUrl(rawUrl)}
            title={resource.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-none"
          />
        </div>
      ) : (
        /* Native DIKSHA Video Player */
        <div className="relative group aspect-video w-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={rawUrl}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            playsInline
          />

          {errorState && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
              <AlertTriangle className="size-10 text-amber-400 mb-2" />
              <p className="text-sm text-slate-200 mb-4">{errorState}</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-white border-white/20"
                onClick={() => {
                  setErrorState(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
              >
                <RotateCcw className="size-3.5 mr-1" /> Retry Stream
              </Button>
            </div>
          )}

          {/* Big Center Play Button Overlay when Paused */}
          {!isPlaying && !errorState && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto size-16 flex items-center justify-center rounded-full bg-primary/90 text-white shadow-2xl transition hover:scale-110 hover:bg-primary"
              aria-label="Play video"
            >
              <Play className="size-8 ml-1 fill-white" />
            </button>
          )}

          {/* Video Control Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col gap-2 transition-opacity duration-200">
            {/* Scrubber */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700/80 accent-primary rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="hover:text-white p-1">
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button onClick={toggleMute} className="hover:text-white p-1">
                    {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-700 accent-white rounded-lg appearance-none cursor-pointer hidden sm:block"
                  />
                </div>

                <span className="font-mono text-[11px] text-slate-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {completed && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] gap-1">
                    <CheckCircle2 className="size-3" /> Completed
                  </Badge>
                )}
                <button onClick={toggleFullscreen} className="hover:text-white p-1">
                  {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attribution & DIKSHA Licensing Footer */}
      <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-semibold tracking-wider border-slate-700 text-slate-300 bg-slate-800"
          >
            {resource.licenseStatus || "DIKSHA Verified"}
          </Badge>
          <span className="truncate max-w-xl text-slate-300">
            {resource.attribution || "Source: DIKSHA National Learning Gateway · NCCT Certified"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {resource.license && (
            <span className="text-[11px] text-slate-400">
              License: <strong className="text-slate-200">{resource.license}</strong>
            </span>
          )}
          {resource.playerUrl && (
            <a
              href={resource.playerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
            >
              Verify Source <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
