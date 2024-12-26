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
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { toast } from "sonner";
import { Project } from "@/types/schemas/Project";
import { RiNextjsFill } from "react-icons/ri";
import { IoLogoVue } from "react-icons/io5";
import { FaAngular, FaReact } from "react-icons/fa";
import { MdOutlineCloudOff } from "react-icons/md";
import BlurFade from "@/components/ui/blur-fade";
import { useEffect, useState } from "react";

// Types
type StatusColors = {
  [key in DeploymentStatus]: string;
};

type LoadingState = {
  isLoading: boolean;
  hasError: boolean;
  isInitialized: boolean;
};

const handleCopyUrl = (domain: string) => {
  navigator.clipboard.writeText(`http://${domain}`);
  toast.success("Copied to clipboard");
};

// Components
const StatusIndicator = ({ status }: { status: DeploymentStatus }) => {
  const statusColors: StatusColors = {
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

const PreviewSection = ({
  project,
  deploymentStatus,
  isLoading,
}: {
  project: Project;
  deploymentStatus?: DeploymentStatus;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Skeleton className="w-full h-64 rounded" />;
  }

  if (!project?.subDomain) {
    return null;
  }

  const FrameworkIcon = {
    "Next.js": () => <RiNextjsFill className="h-14 w-14 text-foreground" />,
    Vue: () => <IoLogoVue className="h-14 w-14 text-green-500" />,
    Angular: () => <FaAngular className="h-14 w-14 text-red-600/80" />,
    React: () => <FaReact className="h-14 w-14 text-blue-500" />,
  }[project.framework] || (() => <FaReact className="h-14 w-14 text-blue-500" />);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-8">
      {deploymentStatus === "IN_PROGRESS" ? (
        <Skeleton className="w-full h-64 rounded" />
      ) : (
        <div className="w-full h-64 rounded flex items-center justify-center">
          <div className="flex items-center justify-center flex-col gap-2">
            <FrameworkIcon />
            <p>Your project is ready! 🎉</p>
          </div>
        </div>
      )}
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

export const DeploymentNotFound = () => (
  <BlurFade key="deployment-not-found" delay={0.25 + 0.5 * 0.05} inView>
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
        <MdOutlineCloudOff className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-xl font-semibold">No Deployment Found</h3>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
        This project hasn't been deployed yet. Create your first deployment to
        get started.
      </p>
    </div>
  </BlurFade>
);

export default function DeploymentDetails({
  deploymentId,
}: {
  deploymentId: string;
}) {
  const dispatch = useAppDispatch();
  const { project, latestDeployment, buildLogs } = useDeploymentDetails(deploymentId);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    hasError: false,
    isInitialized: false
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true
      }));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleCustomDomainSuccess = () => {
    if (project?.ownerId) {
      dispatch(getProjects(project.ownerId));
    }
  };

  // Show loading state
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

  // Show deployment not found
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

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 pb-8 mx-auto space-y-6">
        <Link href="/projects">
          <Button variant="secondary">
            <ChevronLeft />
            All Projects
          </Button>
        </Link>

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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Production Deployment</h2>
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 shadow">
            <div className="grid grid-cols-2 gap-8">
              <PreviewSection
                project={project}
                deploymentStatus={latestDeployment?.deploymentStatus}
                isLoading={loadingState.isLoading}
              />

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