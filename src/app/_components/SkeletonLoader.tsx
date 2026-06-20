export const SkeletonLoader = () => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-grow">
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/10"></div>
            <div className="mt-1 h-3 w-3/4 animate-pulse rounded bg-white/10"></div>
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="h-8 w-16 animate-pulse rounded-lg bg-white/10"></div>
            <div className="h-8 w-16 animate-pulse rounded-lg bg-white/10"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
