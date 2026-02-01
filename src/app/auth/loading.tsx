export default function AuthLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8 md:py-16">
      {/* Header skeleton */}
      <div className="text-center mb-10">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-muted animate-pulse mb-4" />
        <div className="h-8 w-64 rounded-lg bg-muted animate-pulse mx-auto" />
        <div className="h-4 w-80 rounded bg-muted animate-pulse mx-auto mt-3" />
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                <div className="h-3 w-64 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button skeleton */}
      <div className="h-12 rounded-xl bg-muted animate-pulse mt-6" />
    </div>
  );
}
