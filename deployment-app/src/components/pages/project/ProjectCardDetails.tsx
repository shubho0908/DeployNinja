import { GitBranch } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types/schemas/Project";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { FaGithub } from "react-icons/fa";

interface ProjectDetailsProps {
  project: Project;
  isLoading: boolean;
  latestDeployment: any;
}

export function ProjectDetails({ 
  project, 
  isLoading, 
  latestDeployment 
}: ProjectDetailsProps) {
  return (
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
            <FaGithub className="w-4" />
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
          Created {project?.createdAt && formatDistanceToNow(new Date(project.createdAt))} ago
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
  );
}