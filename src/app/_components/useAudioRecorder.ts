"use client";
import { useState, useRef, useCallback } from "react";

export type RecorderState = "idle" | "recording" | "transcribing" | "error";

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Always-fresh refs so onstop never captures a stale callback
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

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
  }, [workerUrl, apiKey, language]); // language/url/key are stable after config loads

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    chunksRef.current = [];
  }, []);

  return { state, start, stop, reset };
}

