import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { toast } from "sonner";
import { API, handleApiError } from "@/redux/api/util";
import { createProject } from "@/redux/api/projectApi";
import { startDeployment } from "@/redux/api/deploymentApi";
import { EnvVar, Repository } from "@/types/schemas/Repository";
import { Project } from "@/types/schemas/Project";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { RootState } from "@/app/store";

export const useCreateProject = () => {
  const [state, setState] = useState({
    envVars: [{ key: "", value: "" }] as EnvVar[],
    selectedFramework: "Next.js",
    repositories: [] as Repository[],
    selectedRepo: null as Repository | null,
    installCommand: "npm install",
    buildCommand: "npm run build",
    projectRootDir: "./",
    isLoading: false,
    error: null as string | null,
    isSubmitting: false
  });

  const { data: session } = useSession();
  const { user } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!session?.username || !session?.accessToken) return;

      setState(s => ({ ...s, isLoading: true, error: null }));
      try {
        const response = await API.get(
          `/git/repositories?username=${encodeURIComponent(session.username)}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }
        );
        
        if (Array.isArray(response.data)) {
          setState(s => ({ ...s, repositories: response.data }));
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch repositories";
        toast.error(errorMessage);
        setState(s => ({ ...s, error: errorMessage }));
      } finally {
        setState(s => ({ ...s, isLoading: false }));
      }
    };

    fetchRepositories();
  }, [session?.username, session?.accessToken]);

  const handleSubmit = async () => {
    setState(s => ({ ...s, isSubmitting: true }));

    if (!state.selectedRepo || !state.selectedFramework) {
      toast.error("Please select both repository and framework.");
      setState(s => ({ ...s, isSubmitting: false }));
      return;
    }

    const projectParams: Project = {
      name: state.selectedRepo.name,
      ownerId: user?.id!,
      subDomain: "",
      framework: state.selectedFramework,
      installCommand: state.installCommand,
      buildCommand: state.buildCommand,
      projectRootDir: state.projectRootDir,
      gitRepoUrl: state.selectedRepo.html_url,
    };

    try {
      const project = await dispatch(createProject(projectParams)).unwrap();
      console.log(project);
      
      if (!project?.id) throw new Error("Project creation failed");

      const deployment = await dispatch(startDeployment({
        projectId: project.id,
        deploymentParams: {
          projectId: project.id,
          gitBranchName: state.selectedRepo.default_branch,
          gitCommitHash: "",
          deploymentStatus: "IN_PROGRESS",
          deploymentMessage: "Deployment has been started",
          environmentVariables: {
            GITHUB_REPO_URL: state.selectedRepo.html_url,
            PROJECT_INSTALL_COMMAND: state.installCommand,
            PROJECT_BUILD_COMMAND: state.buildCommand,
            PROJECT_ROOT_DIR: state.projectRootDir,
            ...Object.fromEntries(
              state.envVars.map(({ key, value }) => [`PROJECT_ENVIRONMENT_${key}`, value])
            )
          },
        },
        requestMaker: "user",
      })).unwrap();

      if (!deployment?.id) throw new Error("Deployment failed");

      toast.success("Project created successfully!");
      router.push(`/deployments/${deployment.id}`);
    } catch (error) {
      setState(s => ({ ...s, isSubmitting: false }));
      toast.error("Failed to create project");
      throw new Error(await handleApiError(error));
    }
  };

  const updateState = (updates: Partial<typeof state>) => {
    setState(s => ({ ...s, ...updates }));
  };

  return {
    state,
    updateState,
    handleSubmit
  };
};