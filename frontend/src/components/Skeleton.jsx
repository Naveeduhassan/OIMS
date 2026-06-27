export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
