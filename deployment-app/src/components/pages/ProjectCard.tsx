import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Terminal,
  Key,
  Box,
  GitBranch,
  Rocket,
  ArrowLeft,
  Loader2,
  Github,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { API, handleApiError } from "@/redux/api/util";
import { useSession } from "next-auth/react";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Project } from "@/types/schemas/Project";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { container, frameworks, item } from "@/utils/constants";
import { EnvVar, Repository } from "@/types/schemas/Repository";
import { useRouter } from "next/navigation";

export default function ProjectPage() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }]);
  const [selectedFramework, setSelectedFramework] = useState("Next.js");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [installCommand, setInstallCommand] = useState("npm install");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [projectRootDir, setProjectRootDir] = useState("./");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Boolean>(false);
  const { data: session } = useSession();
  const { user } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!session?.username || !session?.accessToken) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await API.get(
          `/git/repositories?username=${encodeURIComponent(session.username)}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
        const repos = response.data || [];
        if (Array.isArray(repos)) {
          setRepositories(repos);
        } else {
          console.error("Invalid repositories data format:", repos);
          toast.error("Invalid data format received from server");
          setError("Invalid data format received from server");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories";
        console.error("Error fetching repositories:", errorMessage);
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [session?.username, session?.accessToken]);

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleRepoSelect = (value: string) => {
    const repo = repositories.find((repo) => repo.id.toString() === value);
    setSelectedRepo(repo || null);
  };

  const createProject = async (projectParams: Project) => {
    try {
      const { data } = await API.post("/project", projectParams);
      return data.project;
    } catch (error) {
      throw new Error(await handleApiError(error));
    }
  };

  const createDeployment = async (
    project: Project,
    deploymentParams: DeploymentModel
  ) => {
    try {
      await API.post(`/deploy?projectId=${project.id}`, deploymentParams, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "X-Request-Maker": "user",
        },
      });
    } catch (error) {
      throw new Error(await handleApiError(error));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (!selectedRepo) {
      toast.error("Please select a repository.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedFramework) {
      toast.error("Please select a framework.");
      setIsSubmitting(false);
      return;
    }

    if (envVars.some((envVar) => !envVar.key || !envVar.value)) {
      toast.error("Please fill in all environment variables.");
      setIsSubmitting(false);
      return;
    }

    try {
      const projectParams: Project = {
        name: selectedRepo.name,
        ownerId: user?.id!,
        subDomain: "",
        framework: selectedFramework,
        installCommand: installCommand,
        buildCommand: buildCommand,
        projectRootDir: projectRootDir,
        gitRepoUrl: selectedRepo.html_url,
      };

      const project = await createProject(projectParams);

      const deploymentParams: DeploymentModel = {
        projectId: project.id,
        gitBranchName: selectedRepo.default_branch,
        gitCommitHash: "",
        deploymentStatus: "IN_PROGRESS",
        deploymentMessage: "Deployment has been started",
        environmentVariables: {
          GITHUB_REPO_URL: selectedRepo.html_url,
          PROJECT_INSTALL_COMMAND: installCommand,
          PROJECT_BUILD_COMMAND: buildCommand,
          PROJECT_ROOT_DIR: projectRootDir ?? "./",
          ...Object.fromEntries(
            envVars.map((envVar) => [
              `PROJECT_ENVIRONMENT_${envVar.key}`,
              envVar.value,
            ])
          ),
        },
      };

      await createDeployment(project, deploymentParams);
      toast.success("Project created successfully!");
      router.replace(`/project/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      setIsSubmitting(false);
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-muted/10">
      <div className="max-w-2xl relative top-16 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create New Project</h1>
                <p className="text-muted-foreground">
                  Deploy your next big idea in minutes
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 bg-card p-6 rounded-lg border shadow-sm"
          >
            {/* Repository Selection */}
            <motion.div variants={item} className="space-y-4">
              <Label htmlFor="repo-select" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Select Repository
              </Label>

              {error && (
                <div className="text-sm text-destructive mb-2">
                  Error: {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Loading repositories...
                </div>
              ) : (
                <Select onValueChange={handleRepoSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id.toString()}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>

            {/* Framework selection and other UI elements */}
            {selectedRepo && (
              <motion.div variants={item} className="space-y-4">
                <Label className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Framework
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {frameworks.map((framework) => (
                    <Button
                      key={framework.id}
                      type="button"
                      variant={
                        selectedFramework === framework.name
                          ? "default"
                          : "outline"
                      }
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setSelectedFramework(framework.name)}
                    >
                      <span className="text-2xl">{framework.icon}</span>
                      <span>{framework.name}</span>
                    </Button>
                  ))}
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="build-commands">
                    <AccordionTrigger className="hover:no-underline group">
                      <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Terminal className="h-4 w-4" />
                        Build Commands
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="install-command">
                            Install Command
                          </Label>
                          <Input
                            id="install-command"
                            placeholder="npm install"
                            value={installCommand}
                            onChange={(e) => setInstallCommand(e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="build-command">Build Command</Label>
                          <Input
                            id="build-command"
                            placeholder="npm run build"
                            value={buildCommand}
                            onChange={(e) => setBuildCommand(e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rootDir">Root Directory</Label>
                          <Input
                            id="rootDir"
                            placeholder="./"
                            value={projectRootDir}
                            onChange={(e) => setProjectRootDir(e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="env-vars">
                    <AccordionTrigger className="hover:no-underline group">
                      <span className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Key className="h-4 w-4" />
                        Environment Variables
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {envVars.map((envVar, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2"
                          >
                            <Input
                              placeholder="KEY"
                              value={envVar.key}
                              onChange={(e) => {
                                const newEnvVars = [...envVars];
                                newEnvVars[index].key = e.target.value;
                                setEnvVars(newEnvVars);
                              }}
                              className="font-mono text-sm"
                            />
                            <Input
                              placeholder="VALUE"
                              value={envVar.value}
                              onChange={(e) => {
                                const newEnvVars = [...envVars];
                                newEnvVars[index].value = e.target.value;
                                setEnvVars(newEnvVars);
                              }}
                              className="font-mono text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEnvVar(index)}
                              className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addEnvVar}
                          className="w-full group"
                        >
                          <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
                          Add Environment Variable
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {isSubmitting ? (
                  <Button disabled className="w-full" size="lg">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Please wait
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" onClick={handleSubmit}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
