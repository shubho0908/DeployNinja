"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildLogsSection } from "./BuildLogs";
import { CustomDomainsSection } from "./CustomDomain";
import { getProjects } from "@/redux/api/projectApi";
import { useDeploymentDetails } from "./useDeploymentDetails";
import { useAppDispatch } from "@/redux/hooks";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { DeploymentModel } from "@/types/schemas/Deployment";

// Types
type StatusColors = {
  [key in DeploymentStatus]: string;
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
  deployment,
}: {
  label: string;
  value: React.ReactNode;
  deployment?: DeploymentModel;
}) => (
  <div>
    <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">{label}</h4>
    {!deployment ? <Skeleton className="h-6 w-48" /> : value}
  </div>
);

const PreviewSection = ({
  project,
  isLoading,
  deploymentStatus,
}: {
  project: any;
  isLoading: boolean;
  deploymentStatus?: DeploymentStatus;
}) => (
  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-8">
    {isLoading || deploymentStatus === "IN_PROGRESS" ? (
      <Skeleton className="w-full h-64 rounded" />
    ) : project?.subDomain ? (
      <div className="w-full h-64 rounded flex items-center justify-center">
        <p className="italic">Preview isn't available yet</p>
      </div>
    ) : null}
  </div>
);

const DomainLink = ({
  project,
  deploymentStatus,
}: {
  project: any;
  deploymentStatus?: DeploymentStatus;
}) => {
  const domain = `${project?.subDomain}.localhost:8000`;
  const isReady = deploymentStatus === "READY";
  const isFailed = deploymentStatus === "FAILED";
  const isLoading = deploymentStatus === "IN_PROGRESS";

  if (!project?.subDomain) return null;

  return (
    <Link
      href={isReady ? `http://${domain}` : "#"}
      target={isReady ? "_blank" : "_self"}
      className="text-blue-600 dark:text-blue-400 hover:underline"
    >
      {isFailed || isLoading ? "Unavailable" : domain}
    </Link>
  );
};

export default function DeploymentDetails({
  deploymentId,
}: {
  deploymentId: string;
}) {
  const dispatch = useAppDispatch();
  const { project, latestDeployment, buildLogs, isLoading } =
    useDeploymentDetails(deploymentId);

  const handleCustomDomainSuccess = () => {
    if (project?.ownerId) {
      dispatch(getProjects(project.ownerId));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 pb-8 mx-auto space-y-6">
        <Link href="/projects">
          <Button variant="secondary">
            <ChevronLeft />
            All Projects
          </Button>
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">
            {!latestDeployment ? (
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

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-8">
              <PreviewSection
                project={project}
                isLoading={isLoading}
                deploymentStatus={latestDeployment?.deploymentStatus}
              />

              <div className="space-y-6">
                <DetailItem
                  label="Deployment ID"
                  value={latestDeployment?.id}
                  deployment={latestDeployment}
                />

                <DetailItem
                  label="Domains"
                  value={
                    <DomainLink
                      project={project}
                      deploymentStatus={latestDeployment?.deploymentStatus}
                    />
                  }
                  deployment={latestDeployment}
                />

                <DetailItem
                  label="Status"
                  deployment={latestDeployment}
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
                  deployment={latestDeployment}
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
              buildLogs={buildLogs}
              latestDeployment={latestDeployment}
            />
            <CustomDomainsSection
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
