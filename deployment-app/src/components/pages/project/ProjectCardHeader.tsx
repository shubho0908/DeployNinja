import { Trash } from "lucide-react";
import Link from "next/link";
import { Project } from "@/types/schemas/Project";
import { Button } from "../../ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectIcon } from "./ProjectCardUtils";

interface ProjectHeaderProps {
  project: Project;
  isLoading: boolean;
  latestDeployment: any;
  setIsDialogOpen: (isOpen: boolean) => void;
}

export function ProjectHeader({
  project,
  isLoading,
  latestDeployment,
  setIsDialogOpen,
}: ProjectHeaderProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  return (
    <div className="text-sm font-normal w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <span className="text-4xl">{getProjectIcon(project.framework)}</span>
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
                    ? `${project.subDomain.slice(0, 5)}...localhost:8000`
                    : `${project.subDomain}.localhost:8000`
                  : latestDeployment?.deploymentStatus === "IN_PROGRESS"
                  ? "Deployment in prpogress.."
                  : "Deployment Failed"}
              </Link>
            )}
          </div>
        </div>
        <Button size="icon" variant="destructive" onClick={handleDeleteClick}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
