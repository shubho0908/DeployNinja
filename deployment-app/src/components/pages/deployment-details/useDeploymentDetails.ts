import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { getDeployments, updateDeployment } from "@/redux/api/deploymentApi";
import { API } from "@/redux/api/util";
import { RootState } from "@/app/store";
import { z } from "zod";

const BuildLogSchema = z.object({
  deploymentId: z.string(),
  log: z.string(),
  timestamp: z.string(),
});

type BuildLog = z.infer<typeof BuildLogSchema>;

export const useDeploymentDetails = (deploymentId: string) => {
  const dispatch = useAppDispatch();
  const { projects } = useSelector((state: RootState) => state.projects);
  
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const project = useMemo(
    () => projects?.find((p) => p.deployments?.some((d) => d.id === deploymentId)),
    [projects, deploymentId]
  );

  const latestDeployment = useMemo(
    () => project?.deployments?.find((d) => d.id === deploymentId) || null,
    [project?.deployments, deploymentId]
  );

  useEffect(() => {
    if (project?.id) {
      dispatch(getDeployments(project.id));
    }
  }, [project?.id, dispatch]);

  useEffect(() => {
    if (!latestDeployment?.id) return;

    let pollingInterval: NodeJS.Timeout | undefined;
    let pollingStartTime: number | undefined;

    const fetchBuildLogs = async () => {
      setIsLoading(true);
      try {
        const { data } = await API.get(`/build-logs?deploymentId=${latestDeployment.id}`);
        setBuildLogs(data?.logs);

        if (pollingStartTime && Date.now() - pollingStartTime > 60000) {
          dispatch(updateDeployment({
            deploymentId: latestDeployment.id!,
            deploymentStatus: "FAILED"
          }));
          setIsPolling(false);
          clearInterval(pollingInterval);
          return;
        }

        if (["READY", "FAILED"].includes(latestDeployment.deploymentStatus)) {
          setIsPolling(false);
          clearInterval(pollingInterval);
        } else if (
          data?.logs.some((log: any) => log.log.includes("Upload complete...")) ||
          data?.logs.some((log: any) => /error/i.test(log.log))
        ) {
          dispatch(getDeployments(project?.id!));
        }
      } catch (error) {
        console.error("Failed to fetch build logs:", error);
        setIsPolling(false);
        clearInterval(pollingInterval);
      } finally {
        setIsLoading(false);
      }
    };

    const shouldStartPolling = !["READY", "FAILED"].includes(
      latestDeployment.deploymentStatus
    );

    if (shouldStartPolling && !isPolling) {
      setIsPolling(true);
      pollingStartTime = Date.now();
      fetchBuildLogs();
      pollingInterval = setInterval(fetchBuildLogs, 5000);
    } else if (["READY", "FAILED"].includes(latestDeployment.deploymentStatus)) {
      fetchBuildLogs();
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [latestDeployment?.id, latestDeployment?.deploymentStatus, project?.id, dispatch]);

  return {
    project,
    latestDeployment,
    buildLogs,
    isPolling,
    isLoading
  };
};