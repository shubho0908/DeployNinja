"use client";

import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import Link from "next/link";
import { useAppDispatch } from "@/redux/hooks";
import { useEffect, useMemo, useState } from "react";
import { getDeployments, updateDeployment } from "@/redux/api/deploymentApi";
import { formatDistanceToNow } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Github,
  Loader2,
  OctagonXIcon,
} from "lucide-react";
import { API } from "@/redux/api/util";
import { z } from "zod";
import EditSubdomainDialog from "../EditSubDomainDialog";
import { getProjects } from "@/redux/api/projectApi";

// Types and Schemas
const BuildLogSchema = z.object({
  deploymentId: z.string(),
  log: z.string(),
  timestamp: z.string(),
});

type BuildLog = z.infer<typeof BuildLogSchema>;

// Component
function ProjectDetails({ deploymentId }: { deploymentId: string }) {
  // Redux
  const dispatch = useAppDispatch();
  const { projects } = useSelector((state: RootState) => state.projects);

  // Local state
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized values
  const project = useMemo(
    () =>
      projects?.find((p) => p.deployments?.some((d) => d.id === deploymentId)),
    [projects, deploymentId]
  );

  const latestDeployment = useMemo(() => {
    return project?.deployments?.find((d) => d.id === deploymentId) || null;
  }, [project?.deployments, deploymentId]);

  // Fetch deployments
  useEffect(() => {
    if (project?.id) {
      dispatch(getDeployments(project.id));
    }
  }, [project?.id, dispatch]);

  // Handle build logs fetching and polling
  useEffect(() => {
    if (!latestDeployment?.id) return;

    let pollingInterval: NodeJS.Timeout | undefined;
    let pollingStartTime: number | undefined;

    const fetchBuildLogs = async () => {
      setIsLoading(true);
      try {
        const { data } = await API.get(
          `/build-logs?deploymentId=${latestDeployment.id}`
        );
        setBuildLogs(data?.logs);

        // Check if polling duration exceeds 30 seconds
        if (pollingStartTime && Date.now() - pollingStartTime > 60000) {
          dispatch(
            updateDeployment({
              deploymentId: latestDeployment.id!,
              deploymentStatus: "FAILED",
            })
          );
          setIsPolling(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
          return;
        }

        if (["READY", "FAILED"].includes(latestDeployment.deploymentStatus)) {
          setIsPolling(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
        } else if (
          data?.logs.some((log: any) =>
            log.log.includes("Upload complete...")
          ) ||
          data?.logs.some((log: any) => /error/i.test(log.log))
        ) {
          dispatch(getDeployments(project?.id!));
        }
      } catch (error) {
        console.error("Failed to fetch build logs:", error);
        setIsPolling(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const shouldStartPolling = !["READY", "FAILED"].includes(
      latestDeployment.deploymentStatus
    );

    if (shouldStartPolling && !isPolling) {
      setIsPolling(true);
      pollingStartTime = Date.now(); // Set the polling start time
      fetchBuildLogs();
      pollingInterval = setInterval(fetchBuildLogs, 5000);
    } else if (
      ["READY", "FAILED"].includes(latestDeployment.deploymentStatus)
    ) {
      fetchBuildLogs();
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [
    latestDeployment?.id,
    latestDeployment?.deploymentStatus,
    project?.id,
    dispatch,
  ]);

  const StatusIndicator = ({ status }: { status: string }) => (
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

  const HeaderButton = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => {
    const ButtonComponent = (
      <Link href={href} target="_blank">
        <Button variant="secondary">{children}</Button>
      </Link>
    );

    return ButtonComponent;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-8">
      <div className="max-w-6xl relative top-16 mx-auto space-y-6">
        {/* Header */}
        <Link href="/projects">
          <Button variant="secondary" size="sm">
            <ChevronLeft />
            All Projects
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">{project?.name}</h1>
        </div>

        {/* Deployment Section */}
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
              {["All Deployments"].map((label) => (
                <Link href={`/deployments?id=${project?.id}`}>
                  <Button variant="secondary">
                    <ExternalLink className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Deployment Info */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Preview */}
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-8">
                {project?.subDomain && (
                  <div className="w-full h-64 rounded flex items-center justify-center">
                    <p className="italic">Preview isn't available yet</p>
                  </div>
                )}
              </div>

              {/* Deployment Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                    Deployment ID
                  </h4>
                  <p className="text-sm">{latestDeployment?.id || "N/A"}</p>
                </div>

                <div>
                  <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                    Domains
                  </h4>
                  {project?.subDomain && (
                    <Link
                      href={`http://${project.subDomain}.localhost:8000`}
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {project.subDomain}.localhost:8000
                    </Link>
                  )}
                </div>

                <div>
                  <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                    Status
                  </h4>
                  {latestDeployment && (
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
                  )}
                </div>

                <div>
                  <h4 className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                    Source
                  </h4>
                  <p className="text-sm">{latestDeployment?.gitBranchName}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {latestDeployment?.gitCommitHash?.slice(0, 7)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Build Logs Section */}
          <Accordion
            type="multiple"
            className="border border-zinc-200 dark:border-zinc-800 rounded-lg"
          >
            <AccordionItem
              value="build-logs"
              className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30"
            >
              <AccordionTrigger className="px-4 hover:no-underline border-b hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                <div className="flex justify-between items-center w-full">
                  <span>Build Logs</span>
                  <div className="flex items-center gap-2 mr-1">
                    {isLoading || isPolling ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    ) : latestDeployment?.deploymentStatus === "FAILED" ? (
                      <OctagonXIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-zinc-50 dark:bg-zinc-900/50">
                <div className="text-sm font-mono whitespace-pre-wrap space-y-1">
                  {buildLogs
                    ?.sort(
                      (a, b) =>
                        new Date(a.timestamp).getTime() -
                        new Date(b.timestamp).getTime()
                    )
                    .map((log, index) => (
                      <div
                        key={index}
                        className="p-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                      >
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="ml-2">
                          {log.log.replace(/^\n/, "")}
                        </span>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              disabled={isLoading || isPolling}
              value="custom-domains"
              className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30"
            >
              <AccordionTrigger className="px-4 hover:no-underline border-b hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                <div className="flex justify-between items-center w-full">
                  <span>Assigning Custom Domains</span>
                  <div className="flex items-center gap-2 mr-1">
                    {isLoading || isPolling ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    ) : latestDeployment?.deploymentStatus === "FAILED" ? (
                      <OctagonXIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-zinc-50 dark:bg-zinc-900/50 p-4">
                <div className="space-y-2 flex items-center justify-between">
                  <div className="domains">
                    <div className="flex items-center justify-between rounded-md">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`http://${project?.subDomain}.localhost:8000`}
                          target="_blank"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          {project?.subDomain}
                        </Link>
                        <ExternalLink className="h-4 w-4 text-zinc-500 dark:text-zinc-400 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                  <div className="editable">
                    <EditSubdomainDialog
                      projectId={project?.id!}
                      deploymentId={latestDeployment?.id || ""}
                      currentSubdomain={project?.subDomain || ""}
                      onSuccess={() => {
                        if (project?.ownerId) {
                          dispatch(getProjects(project?.ownerId));
                        }
                      }}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
