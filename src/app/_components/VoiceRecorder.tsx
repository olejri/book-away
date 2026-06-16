"use client";

import dynamic from "next/dynamic";

// We load the actual recorder via a wrapper
export const VoiceRecorder = dynamic(
  () => import("./VoiceRecorderInner").then((m) => m.VoiceRecorderInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="h-32 w-32 animate-pulse rounded-full bg-white/10" />
        <p className="text-white/30">Loading voice recorder…</p>
      </div>
    ),
  },
);

