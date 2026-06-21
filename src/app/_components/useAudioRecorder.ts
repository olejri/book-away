"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "transcribing" | "error";

/**
 * Hard client-side recording limit (seconds).
 *
 * This is a *guesstimate* safety cap: Google's synchronous speech:recognize
 * endpoint rejects audio longer than ~60s, so we auto-stop at 50s to leave a
 * comfortable margin and give the user a clear visual countdown.
 */
export const MAX_RECORDING_SECONDS = 50;

interface Options {
  workerUrl: string;
  apiKey: string;
  language: string;
  onTranscript: (text: string) => void;
  onError: (msg: string) => void;
}

/**
 * Records audio via MediaRecorder API (works on Android Chrome + iOS Safari),
 * uploads the full blob on stop, and returns a Google Speech-to-Text V2 transcript.
 *
 * Uses refs for callbacks to avoid stale-closure issues while keeping the
 * start() dependency array minimal.
 */
export function useAudioRecorder({
  workerUrl,
  apiKey,
  language,
  onTranscript,
  onError,
}: Options) {
  const [state, setState] = useState<RecorderState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Countdown timer handles (interval tick + hard auto-stop timeout)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-fresh refs so onstop never captures a stale callback
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  // Tidy up timers if the component unmounts mid-recording
  useEffect(() => clearTimers, [clearTimers]);

  const start = useCallback(async () => {
    chunksRef.current = [];

    // ── Request microphone ────────────────────────────────────────────────
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // preferred by Speech-to-Text
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
    } catch {
      onErrorRef.current(
        "Microphone permission denied. Please allow microphone access in your browser settings and try again.",
      );
      setState("error");
      return;
    }

    // ── Pick best supported MIME type ─────────────────────────────────────
    // Android Chrome → audio/webm;codecs=opus
    // iOS Safari     → audio/mp4
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ].find((t) => MediaRecorder.isTypeSupported(t));

    const mediaRecorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      // Stop the countdown the moment recording ends
      clearTimers();
      setSecondsLeft(MAX_RECORDING_SECONDS);

      // Stop all mic tracks immediately
      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, {
        type: mediaRecorder.mimeType || "audio/webm",
      });

      if (blob.size < 200) {
        onErrorRef.current(
          "Recording was too short or empty. Please try again.",
        );
        setState("idle");
        return;
      }

      setState("transcribing");

      try {
        const formData = new FormData();
        // language is captured from the closure at start() call time — correct
        formData.append("audio", blob, "recording.webm");
        formData.append("language", language);

        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? `Server error ${res.status}`);
        }

        const { transcript } = (await res.json()) as { transcript: string };

        if (!transcript?.trim()) {
          onErrorRef.current(
            "No speech detected. Please speak clearly and try again.",
          );
          setState("idle");
          return;
        }

        onTranscriptRef.current(transcript.trim());
        setState("idle");
      } catch (err) {
        onErrorRef.current(
          err instanceof Error
            ? err.message
            : "Transcription failed. Please try again.",
        );
        setState("error");
      }
    };

    mediaRecorder.start();
    setState("recording");

    // ── Start client-side countdown ───────────────────────────────────────
    // Smooth 100ms ticks for the shrinking bar, plus a hard auto-stop so we
    // never exceed the speech API's ~60s sync limit.
    const startedAt = Date.now();
    setSecondsLeft(MAX_RECORDING_SECONDS);

    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);
      setSecondsLeft(remaining);
    }, 100);

    autoStopRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }, MAX_RECORDING_SECONDS * 1000);
  }, [workerUrl, apiKey, language, clearTimers]); // stable after config loads

  const stop = useCallback(() => {
    clearTimers();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setState("idle");
    setSecondsLeft(MAX_RECORDING_SECONDS);
    chunksRef.current = [];
  }, [clearTimers]);

  return { state, secondsLeft, maxSeconds: MAX_RECORDING_SECONDS, start, stop, reset };
}

