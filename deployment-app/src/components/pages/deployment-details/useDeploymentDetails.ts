import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { getDeployments } from "@/redux/api/deploymentApi";
import { API } from "@/redux/api/util";
import { RootState } from "@/app/store";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { Project } from "@/types/schemas/Project";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { z } from "zod";

// Schema for build logs
export const BuildLogsSchema = z.object({
  event_id: z.string(),
  deployment_id: z.string(),
  log: z.string(),
  timestamp: z.string(),
});

type BuildLogs = z.infer<typeof BuildLogsSchema>;

const POLLING_INTERVAL = 5000; // 5 seconds

// Define deployment status types
const TERMINAL_STATES: readonly DeploymentStatus[] = ["READY", "FAILED"];

export const useDeploymentDetails = (deploymentId: string) => {
  const dispatch = useAppDispatch();
  const { projects } = useSelector((state: RootState) => state.projects);
  const [buildLogs, setBuildLogs] = useState<BuildLogs[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [hasFetchedTerminalState, setHasFetchedTerminalState] = useState(false);

  // Find current project and deployment
  const project = projects?.find((p) =>
    p.deployments?.some((d) => d.id === deploymentId)
  ) as Project;
  const deployment = project?.deployments?.find(
    (d) => d.id === deploymentId
  ) as DeploymentModel;

  // Fetch build logs from API
  const fetchBuildLogs = async () => {
    if (!deployment?.id) return;

    setIsLoading(true);
    try {
      const { data } = await API.get(
        `/build-logs?deploymentId=${deployment.id}`
      );
      setBuildLogs(data?.logs);

      // Handle terminal states
      if (
        TERMINAL_STATES.includes(
          deployment?.deploymentStatus as DeploymentStatus
        )
      ) {
        setHasFetchedTerminalState(true);
        stopPolling();
      }
    } catch (error) {
      console.error("Failed to fetch build logs:", error);
      stopPolling(); // Stop polling on error to prevent infinite failed requests
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling
  const startPolling = () => {
    if (!pollingInterval) {
      fetchBuildLogs(); // Initial fetch
      const interval = setInterval(fetchBuildLogs, POLLING_INTERVAL);
      setPollingInterval(interval);
    }
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Fetch initial deployment data
  useEffect(() => {
    if (project?.id) {
      dispatch(getDeployments(project.id));
    }
  }, [project?.id, dispatch]);

  // Handle polling and single fetch logic
  useEffect(() => {
    if (!deployment?.id) return;

    const currentStatus = deployment.deploymentStatus as DeploymentStatus;
    const isTerminalState = TERMINAL_STATES.includes(currentStatus);

    if (isTerminalState) {
      if (!hasFetchedTerminalState) {
        fetchBuildLogs();
        setHasFetchedTerminalState(true);
      }
      stopPolling();
    } else {
      // For non-terminal states, start polling
      setHasFetchedTerminalState(false);
      startPolling();
    }

    return () => stopPolling();
  }, [deployment?.id, deployment?.deploymentStatus]);

  // Reset state when deploymentId changes
  useEffect(() => {
    setHasFetchedTerminalState(false);
    stopPolling();
  }, [deploymentId]);

  return {
    project,
    deployment,
    buildLogs,
    isLoading,
    latestDeployment: deployment,
  };
};
