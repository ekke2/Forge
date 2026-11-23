import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-64" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, c) => (
        <div key={c} className="space-y-2">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-10" />
        </div>
      ))}
    </div>
  );
}

export function FeedSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
