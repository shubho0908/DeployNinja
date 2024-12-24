import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { getDeployments } from "@/redux/api/deploymentApi";
import { API } from "@/redux/api/util";
import { RootState } from "@/app/store";

import { z } from "zod";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { Project } from "@/types/schemas/Project";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { BuildLogsSchema } from "@/app/api/(build)/build-logs/route";

export type BuildLog = z.infer<typeof BuildLogsSchema>;

const POLLING_INTERVAL = 5000; // 5 seconds

// Define deployment status types
const TERMINAL_STATES: readonly DeploymentStatus[] = ["READY", "FAILED"];

export const useDeploymentDetails = (deploymentId: string) => {
  const dispatch = useAppDispatch();
  const { projects } = useSelector((state: RootState) => state.projects);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

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

      // Refresh deployment data if status changed
      if (data?.status !== deployment.deploymentStatus) {
        await dispatch(getDeployments(project?.id!));
      }

      // Stop polling if we've reached a terminal state
      if (
        TERMINAL_STATES.includes(
          deployment.deploymentStatus as DeploymentStatus
        )
      ) {
        stopPolling();
      }
    } catch (error) {
      console.error("Failed to fetch build logs:", error);
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

    const isTerminalState = TERMINAL_STATES.includes(
      deployment.deploymentStatus as DeploymentStatus
    );

    if (isTerminalState) {
      // For terminal states, fetch once and stop polling
      fetchBuildLogs();
      stopPolling();
    } else {
      // For non-terminal states, start polling
      startPolling();
    }

    return () => stopPolling();
  }, [deployment?.id, deployment?.deploymentStatus]);

  return {
    project,
    deployment,
    buildLogs,
    isLoading,
    latestDeployment: deployment,
    isPolling: !!pollingInterval,
  };
};
