"use client";

import { useSearchParams } from "next/navigation";
import { ChevronLeft, GitBranch } from "lucide-react";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/utils/formatDate";
import { Geist_Mono } from "next/font/google";
import BlurFade from "@/components/ui/blur-fade";
import BlurIn from "@/components/ui/blur-in";
import { DeploymentNotFound } from "./DeploymentDetails";
import { DeploymentModel } from "@/types/schemas/Deployment";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

function DeploymentSkeleton() {
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

export default function AllDeployments() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("id");
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  const project = useMemo(
    () => projects?.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const sortedDeployments = useMemo(() => {
    const allDeployments = projects
      ?.flatMap((p) => p.deployments)
      .filter(
        (d): d is DeploymentModel =>
          d !== undefined && d.projectId === project?.id
      )
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    return allDeployments || [];
  }, [projects, project?.id]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const renderDeploymentStatus = (
    status: DeploymentModel["deploymentStatus"]
  ) => (
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

  const renderDeploymentMeta = (
    deployment: DeploymentModel,
    isLatest: boolean
  ) => (
    <div className="mt-2 flex items-center gap-4">
      {isLatest && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            Current
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-zinc-400" />
        <span className={`text-sm ${geistMono.className}`}>
          {deployment.gitBranchName || "main"}
        </span>
        <span className="text-zinc-400">
          {deployment.gitCommitHash?.slice(0, 7)}
        </span>
      </div>
    </div>
  );

  const renderContent = () => {
    return (
      <>
        {isLoading && sortedDeployments.length === 0 ? (
          <>
            <BlurFade key="title" delay={0.25 + 0.5 * 0.05} inView>
              <div className="space-y-2">
                <Skeleton className="h-12 w-64" />
              </div>
            </BlurFade>
            <BlurFade key="skeletons" delay={0.25 + 0.5 * 0.05} inView>
              <DeploymentSkeleton />
              <DeploymentSkeleton />
              <DeploymentSkeleton />
            </BlurFade>
          </>
        ) : !isLoading && sortedDeployments.length === 0 ? (
          <DeploymentNotFound />
        ) : (
          <>
            <BlurIn
              word={`Deployments of ${project?.name}`}
              className="text-3xl font-semibold mb-8 text-black text-left dark:text-white"
            />
            <div className="space-y-4">
              {sortedDeployments.map((deployment, index) => (
                <BlurFade
                  key={deployment.id}
                  delay={0.25 + index * 0.05}
                  inView
                >
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/deployments/${deployment.id}`}
                          className={`text-sm ${geistMono.className} text-blue-600 dark:text-blue-400 hover:underline`}
                        >
                          {deployment.id?.slice(0, 7)}
                        </Link>
                        {renderDeploymentStatus(deployment.deploymentStatus)}
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {deployment.createdAt &&
                            formatTimeAgo(new Date(deployment.createdAt))}
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
                        {deployment.createdAt &&
                          formatTimeAgo(new Date(deployment.createdAt))}{" "}
                        by {user?.username}
                      </span>
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 mx-auto space-y-6">
        <BlurFade key="back-button" delay={0.25 + 0.5 * 0.05} inView>
          <Link href="/projects">
            <Button variant="secondary">
              <ChevronLeft />
              All Projects
            </Button>
          </Link>
        </BlurFade>
        {renderContent()}
      </div>
    </div>
  );
}
