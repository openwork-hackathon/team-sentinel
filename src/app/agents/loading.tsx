export default function AgentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="animate-pulse rounded bg-muted h-7 w-52" />
          <div className="animate-pulse rounded bg-muted h-4 w-72" />
        </div>
        <div className="animate-pulse rounded bg-muted h-6 w-24 rounded-full" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="animate-pulse rounded bg-muted h-4 w-24" />
                  <div className="animate-pulse rounded bg-muted h-7 w-20" />
                  <div className="animate-pulse rounded bg-muted h-3 w-32" />
                </div>
                <div className="animate-pulse rounded bg-muted h-10 w-10 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 pb-3">
          <div className="animate-pulse rounded bg-muted h-5 w-28" />
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="animate-pulse rounded bg-muted h-4 w-32" />
                    <div className="animate-pulse rounded bg-muted h-3 w-full" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="animate-pulse rounded-full bg-muted h-4 w-16" />
                  <div className="animate-pulse rounded-full bg-muted h-4 w-14" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="animate-pulse rounded bg-muted h-3 w-12" />
                  <div className="animate-pulse rounded bg-muted h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
