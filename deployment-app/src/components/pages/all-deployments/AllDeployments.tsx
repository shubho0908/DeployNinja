"use client";

import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import BlurIn from "@/components/ui/blur-in";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { DeploymentSkeleton } from "./DeploymentSkeleton";
import { DeploymentCard } from "./DeploymentCard";
import { Skeleton } from "../../ui/skeleton";
import { DeploymentNotFound } from "../deployment-details/DeploymentNotFound";

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

  const renderContent = () => {
    if (isLoading && sortedDeployments.length === 0) {
      return (
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
      );
    }

    if (!isLoading && sortedDeployments.length === 0) {
      return <DeploymentNotFound />;
    }

    return (
      <>
        <BlurIn
          word={`Deployments of ${project?.name}`}
          className="text-3xl font-semibold mb-8 text-black text-left dark:text-white"
        />
        <div className="space-y-4">
          {sortedDeployments.map((deployment, index) => (
            <DeploymentCard
              key={deployment.id}
              deployment={deployment}
              index={index}
              user={user!}
            />
          ))}
        </div>
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
