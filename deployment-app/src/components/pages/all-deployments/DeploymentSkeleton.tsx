import { Skeleton } from "@/components/ui/skeleton";

export function DeploymentSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 my-2">
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-2 flex items-center gap-4">
          <Skeleton className="h-5 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}