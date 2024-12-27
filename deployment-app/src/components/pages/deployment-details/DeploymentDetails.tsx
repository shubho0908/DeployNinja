"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, Copy, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildLogsSection } from "./BuildLogs";
import { CustomDomainsSection } from "./CustomDomain";
import { getProjects } from "@/redux/api/projectApi";
import { useDeploymentDetails } from "./useDeploymentDetails";
import { useAppDispatch } from "@/redux/hooks";
import { useEffect, useState } from "react";
import { Project } from "@/types/schemas/Project";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { PreviewSection } from "./PreviewSection";
import { DeploymentNotFound } from "./DeploymentNotFound";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface LoadingState {
  isLoading: boolean;
  hasError: boolean;
  isInitialized: boolean;
}

// Utility function for clipboard
const handleCopyUrl = (domain: string) => {
  navigator.clipboard.writeText(`http://${domain}`);
  toast.success("Copied to clipboard");
};

const DetailItem = ({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
}) => (
  <div>
    <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">{label}</h4>
    {isLoading ? <Skeleton className="h-6 w-48" /> : value}
  </div>
);

const StatusIndicator = ({ status }: { status: DeploymentStatus }) => {
  const statusColors = {
    READY: "bg-green-500",
    FAILED: "bg-red-500",
    IN_PROGRESS: "bg-yellow-500",
    NOT_STARTED: "bg-gray-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <span className="text-sm">
        {status === "IN_PROGRESS" ? "IN PROGRESS" : status}
      </span>
    </div>
  );
};

const DomainLink = ({
  project,
  deploymentStatus,
}: {
  project: Project;
  deploymentStatus?: DeploymentStatus;
}) => {
  if (!project?.subDomain) return null;

  const domain = `${project.subDomain}.localhost:8000`;
  const isReady = deploymentStatus === "READY";
  const isFailed = deploymentStatus === "FAILED";
  const isLoading = deploymentStatus === "IN_PROGRESS";

  return (
    <div className="flex items-center gap-2">
      <Link
        href={isReady ? `http://${domain}` : "#"}
        target={isReady ? "_blank" : "_self"}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {isFailed || isLoading ? "Unavailable" : domain}
      </Link>
      {isReady && (
        <Copy
          onClick={() => handleCopyUrl(domain)}
          className="h-4 w-4 text-zinc-500 dark:text-zinc-400 ml-1 cursor-pointer"
        />
      )}
    </div>
  );
};

export default function DeploymentDetails({
  deploymentId,
}: {
  deploymentId: string;
}) {
  const dispatch = useAppDispatch();
  const { project, latestDeployment, buildLogs } =
    useDeploymentDetails(deploymentId);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    hasError: false,
    isInitialized: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingState((prev) => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
      }));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleCustomDomainSuccess = () => {
    if (project?.ownerId) {
      dispatch(getProjects(project.ownerId));
    }
  };

  // Loading state
  if (loadingState.isLoading && !loadingState.isInitialized) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl relative top-16 pb-8 mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // No deployment found
  if (!loadingState.isLoading && !latestDeployment) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl relative top-16 pb-8 mx-auto space-y-6">
          <Link href="/projects">
            <Button variant="secondary">
              <ChevronLeft />
              All Projects
            </Button>
          </Link>
          <DeploymentNotFound />
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 pb-8 mx-auto space-y-6">
        {/* Header Navigation */}
        <Link href="/projects">
          <Button variant="secondary">
            <ChevronLeft />
            All Projects
          </Button>
        </Link>

        {/* Title and Actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">
            {loadingState.isLoading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              project?.name
            )}
          </h1>

          <div className="flex gap-2">
            {project?.gitRepoUrl && (
              <Link href={project.gitRepoUrl} target="_blank">
                <Button variant="secondary">
                  <Github className="h-4 w-4" />
                  Repository
                </Button>
              </Link>
            )}
            <Link href={`/deployments?id=${project?.id}`}>
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" />
                All Deployments
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Production Deployment</h2>

          {/* Deployment Info Card */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 shadow">
            <div className="grid grid-cols-2 gap-8">
              {/* Preview Section */}
              <PreviewSection
                project={project}
                deploymentStatus={latestDeployment?.deploymentStatus}
                isLoading={loadingState.isLoading}
              />

              {/* Deployment Details */}
              <div className="space-y-6">
                <DetailItem
                  label="Deployment ID"
                  value={latestDeployment?.id}
                  isLoading={loadingState.isLoading}
                />

                <DetailItem
                  label="Domains"
                  value={
                    <DomainLink
                      project={project}
                      deploymentStatus={latestDeployment?.deploymentStatus}
                    />
                  }
                  isLoading={loadingState.isLoading}
                />

                <DetailItem
                  label="Status"
                  isLoading={loadingState.isLoading}
                  value={
                    latestDeployment && (
                      <>
                        <StatusIndicator
                          status={latestDeployment.deploymentStatus}
                        />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          Created{" "}
                          {formatDistanceToNow(
                            new Date(latestDeployment.createdAt!)
                          )}{" "}
                          ago
                        </p>
                      </>
                    )
                  }
                />

                <DetailItem
                  label="Source"
                  isLoading={loadingState.isLoading}
                  value={
                    <>
                      <p className="text-sm">
                        {latestDeployment?.gitBranchName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {latestDeployment?.gitCommitHash?.slice(0, 7)}
                      </p>
                    </>
                  }
                />
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <Accordion
            type="multiple"
            className="border border-zinc-200 dark:border-zinc-800 rounded-lg"
          >
            <BuildLogsSection
              isLoading={loadingState.isLoading}
              buildLogs={buildLogs}
              latestDeployment={latestDeployment}
            />
            <CustomDomainsSection
              isLoading={loadingState.isLoading}
              project={project}
              latestDeployment={latestDeployment}
              onSuccess={handleCustomDomainSuccess}
            />
          </Accordion>
        </div>
      </div>
    </div>
  );
}
