"use client";

import { useSearchParams } from "next/navigation";
import { ChevronLeft, GitBranch } from "lucide-react";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import Link from "next/link";
import { Button } from "../ui/button";

function AllDeployments() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.user);

  const project = useMemo(
    () => projects?.find((p) => p.id === projectId),
    [projects, projectId]
  );

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

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

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
        <h1 className="text-3xl font-semibold mb-8">
          Deployments of {project?.name && `— ${project.name}`}
        </h1>

        <div className="space-y-4">
          {sortedDeployments?.map((deployment, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllDeployments;
