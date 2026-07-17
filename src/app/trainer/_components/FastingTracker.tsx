"use client";

import dynamic from "next/dynamic";

export const FastingTracker = dynamic(
  () => import("./FastingTrackerInner").then((m) => m.FastingTrackerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-xl bg-white/5" />
      </div>
    ),
  },
);
