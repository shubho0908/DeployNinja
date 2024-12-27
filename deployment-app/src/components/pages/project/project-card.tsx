"use client";

import { motion } from "framer-motion";
import { Trash, GithubIcon, Loader2, GitBranch } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types/schemas/Project";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/redux/api/util";
import { useAppDispatch } from "@/redux/hooks";
import { deleteProject } from "@/redux/api/projectApi";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { MagicCard } from "@/components/ui/magic-card";
import { FaReact, FaAngular } from "react-icons/fa";
import { RiNextjsFill } from "react-icons/ri";
import { IoLogoVue } from "react-icons/io5";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [latestDeployment, setLatestDeployment] = useState<any>(null);
  const { theme } = useTheme();

  const getProjectIcon = () => {
    switch (project.framework) {
      case "React":
        return <FaReact className="w-15 h-15 text-blue-500" />;
      case "Next.js":
        return <RiNextjsFill className="w-15 h-15 text-foreground" />;
      case "Vue":
        return <IoLogoVue className="w-15 h-15 text-green-500" />;
      case "Angular":
        return <FaAngular className="w-15 h-15 text-red-600/80" />;
      default:
        return <FaReact className="w-15 h-15 text-blue-500" />;
    }
  };

  useEffect(() => {
    const getLatestDeployment = () => {
      if (!project.deployments || project.deployments.length === 0) return null;

      const sortedDeployments = [...project.deployments].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      return sortedDeployments[0];
    };

    // Simulate loading delay
    const timer = setTimeout(() => {
      setLatestDeployment(getLatestDeployment());
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [project.deployments]);

  const handleProjectDeletion = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDeleting(true);
    try {
      if (project?.id) {
        await dispatch(deleteProject(project?.id));
        toast.success("Project deleted successfully");
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast.error("Failed to delete project");
      throw new Error(await handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleCardClick = () => {
    if (!isDialogOpen && latestDeployment?.id) {
      router.push(`/deployments/${latestDeployment.id}`);
    }
  };

  return (
    <>
      <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
        <MagicCard
          gradientSize={180}
          gradientOpacity={0.5}
          className="cursor-pointer flex-col items-center justify-center shadow whitespace-nowrap text-4xl w-full"
          gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
        >
          <div
            className="space-y-0 p-4 flex justify-between w-full"
            onClick={handleCardClick}
          >
            <div className="text-sm font-normal w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-4xl">{getProjectIcon()}</span>
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium text-lg">
                      {project.name}
                    </span>
                    {isLoading ? (
                      <Skeleton className="h-4 w-48 mt-1" />
                    ) : (
                      <Link
                        href={
                          latestDeployment?.deploymentStatus === "READY"
                            ? `http://${project.subDomain}.localhost:8000`
                            : "#"
                        }
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {latestDeployment?.deploymentStatus === "READY"
                          ? project.subDomain.length > 5
                            ? `${project.subDomain.slice(
                                0,
                                5
                              )}...localhost:8000`
                            : `${project.subDomain}.localhost:8000`
                          : "Deployment Failed"}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {project.name}? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDialogOpen(false);
                          }}
                          disabled={isDeleting}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleProjectDeletion}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 pt-0">
            <div className="flex items-start flex-col gap-2 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <Link
                  href={project.gitRepoUrl}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="flex relative z-10 items-center gap-2 px-3 py-1 rounded-full dark:text-white text-black dark:bg-gray-800/70 bg-gray-200 hover:text-foreground transition-colors"
                >
                  <GithubIcon className="w-4" />
                  <span>
                    {new URL(project.gitRepoUrl).pathname.split("/")[1]}/
                    {new URL(project.gitRepoUrl).pathname.split("/")[2]}
                  </span>
                </Link>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-40 mt-3 ml-1" />
            ) : (
              <p className="text-sm text-muted-foreground mt-3 ml-1">
                Created{" "}
                {project?.createdAt &&
                  formatDistanceToNow(new Date(project.createdAt))}{" "}
                ago
              </p>
            )}
            <div className="flex items-end gap-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mt-3 ml-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mt-3 ml-1">
                    {latestDeployment?.gitCommitHash?.slice(0, 7)}
                  </p>
                  <span className="flex items-center gap-2 text-sm">
                    <GitBranch className="w-4 text-primary" />
                    {latestDeployment?.gitBranchName}
                  </span>
                </>
              )}
            </div>
          </div>
        </MagicCard>
      </motion.div>
    </>
  );
}

export default ProjectCard;
