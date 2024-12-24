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

interface HeaderButtonProps {
  href: string;
  children: React.ReactNode;
}

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  isLoading?: boolean;
}

const StatusIndicator = ({ status }: { status: DeploymentStatus }) => (
  <div className="flex items-center gap-2">
    <span
      className={`w-2 h-2 rounded-full ${
        status === "READY"
          ? "bg-green-500"
          : status === "FAILED"
          ? "bg-red-500"
          : "bg-yellow-500"
      }`}
    />
    <span className="text-sm">{status}</span>
  </div>
);

const HeaderButton = ({ href, children }: HeaderButtonProps) => (
  <Link href={href} target="_blank">
    <Button variant="secondary">{children}</Button>
  </Link>
);

const DetailItem = ({ label, value, isLoading }: DetailItemProps) => (
  <div>
    <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">{label}</h4>
    {isLoading ? <Skeleton className="h-6 w-48" /> : value}
  </div>
);
export default function DeploymentDetails({
  deploymentId,
}: {
  deploymentId: string;
}) {
  const dispatch = useAppDispatch();
  const { project, latestDeployment, buildLogs, isLoading } =
    useDeploymentDetails(deploymentId);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 pb-8 mx-auto space-y-6">
        <Link href="/projects">
          <Button variant="secondary" size="sm">
            <ChevronLeft />
            All Projects
          </Button>
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">
            {isLoading ? <Skeleton className="h-9 w-64" /> : project?.name}
          </h1>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Production Deployment</h2>
            <div className="flex gap-2">
              {project?.gitRepoUrl && (
                <HeaderButton href={project.gitRepoUrl}>
                  <Github className="h-4 w-4" />
                  Repository
                </HeaderButton>
              )}
              <Link href={`/deployments?id=${project?.id}`}>
                <Button variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  All Deployments
                </Button>
              </Link>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-8">
                {isLoading ? (
                  <Skeleton className="w-full h-64 rounded" />
                ) : project?.subDomain ? (
                  <div className="w-full h-64 rounded flex items-center justify-center">
                    <p className="italic">Preview isn't available yet</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                <DetailItem
                  label="Deployment ID"
                  value={latestDeployment?.id}
                  isLoading={isLoading}
                />

                <div>
                  <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                    Domains
                  </h4>
                  {isLoading ? (
                    <Skeleton className="h-6 w-64" />
                  ) : project?.subDomain ? (
                    <Link
                      href={`http://${project.subDomain}.localhost:8000`}
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {project.subDomain}.localhost:8000
                    </Link>
                  ) : null}
                </div>

                <div>
                  <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                    Status
                  </h4>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ) : (
                    latestDeployment && (
                      <>
                        <StatusIndicator
                          status={latestDeployment.deploymentStatus}
                        />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          Created{" "}
                          {formatDistanceToNow(
                            new Date(latestDeployment?.createdAt!)
                          )}{" "}
                          ago
                        </p>
                      </>
                    )
                  )}
                </div>

                <DetailItem
                  label="Source"
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
                  isLoading={isLoading}
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
              onSuccess={() => {
                if (project?.ownerId) {
                  dispatch(getProjects(project.ownerId));
                }
              }}
            />
          </Accordion>
        </div>
      </div>
    </div>
  );
}
