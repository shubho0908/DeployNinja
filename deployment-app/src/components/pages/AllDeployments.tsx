"use client";

import { useSearchParams } from "next/navigation";
import { ChevronLeft, GitBranch } from "lucide-react";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/utils/formatDate";

function DeploymentSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" /> {/* Deployment ID */}
          <Skeleton className="h-4 w-24" /> {/* Status */}
          <Skeleton className="h-4 w-32" /> {/* Time ago */}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <Skeleton className="h-5 w-16" /> {/* Current tag */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" /> {/* Git icon */}
            <Skeleton className="h-4 w-24" /> {/* Branch name */}
            <Skeleton className="h-4 w-16" /> {/* Commit hash */}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-full" /> {/* User image */}
        <Skeleton className="h-4 w-48" /> {/* User info */}
      </div>
    </div>
  );
}

export default function AllDeployments() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(true);

  // Memoize specific project
  const project = useMemo(
    () => projects?.find((p) => p.id === projectId),
    [projects, projectId]
  );

  // Memoize sorted deployments
  const sortedDeployments = useMemo(() => {
    return projects
      ?.flatMap((p) => p.deployments)
      .filter((d) => d?.projectId === project?.id)
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
      );
  }, [projects, project?.id]);

  // Loading state
  useEffect(() => {
    if (projects || sortedDeployments) {
      setLoading(false);
    }
  }, [projects, sortedDeployments]);

  const renderDeploymentStatus = (status: string) => (
    <span className="flex items-center gap-1">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "READY"
            ? "bg-green-500"
            : status === "IN_PROGRESS"
            ? "bg-yellow-500"
            : "bg-red-500"
        }`}
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{status}</span>
    </span>
  );

  const renderDeploymentMeta = (deployment: any, isLatest: boolean) => (
    <div className="mt-2 flex items-center gap-4">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {isLatest && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            Current
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-mono">
          {deployment?.gitBranchName || "main"}
        </span>
        <span className="text-zinc-400">
          {deployment?.gitCommitHash?.slice(0, 7)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 mx-auto space-y-6">
        <Link href="/projects">
          <Button variant="secondary" size="sm">
            <ChevronLeft />
            All Projects
          </Button>
        </Link>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" /> {/* Project name skeleton */}
          </div>
        ) : (
          <h1 className="text-3xl font-semibold mb-8">
            Deployments of {project?.name && `— ${project.name}`}
          </h1>
        )}

        <div className="space-y-4">
          {loading ? (
            // Show 3 skeleton items while loading
            <>
              <DeploymentSkeleton />
              <DeploymentSkeleton />
              <DeploymentSkeleton />
            </>
          ) : (
            sortedDeployments?.map((deployment, index) => (
              <div
                key={deployment?.id}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/deployments/${deployment?.id}`}
                      className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {deployment?.id?.slice(0, 7)}
                    </Link>
                    {renderDeploymentStatus(deployment?.deploymentStatus!)}
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatTimeAgo(new Date(deployment?.createdAt!))}
                    </span>
                  </div>
                  {renderDeploymentMeta(deployment, index === 0)}
                </div>

                <div className="flex items-center gap-2">
                  <img
                    src={user?.profileImage ?? ""}
                    alt={user?.name ?? "User"}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatTimeAgo(new Date(deployment?.createdAt!))} by{" "}
                    {user?.username}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
