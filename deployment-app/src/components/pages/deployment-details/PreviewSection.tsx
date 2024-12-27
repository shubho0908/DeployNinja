import { Project } from "@/types/schemas/Project";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { Skeleton } from "@/components/ui/skeleton";
import { RiNextjsFill } from "react-icons/ri";
import { IoLogoVue } from "react-icons/io5";
import { FaAngular, FaReact } from "react-icons/fa";

export const PreviewSection = ({
  project,
  deploymentStatus,
  isLoading,
}: {
  project: Project;
  deploymentStatus?: DeploymentStatus;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Skeleton className="w-full h-64 rounded" />;
  }

  if (!project?.subDomain) {
    return null;
  }

  const FrameworkIcon = {
    "Next.js": () => <RiNextjsFill className="h-14 w-14 text-foreground" />,
    Vue: () => <IoLogoVue className="h-14 w-14 text-green-500" />,
    Angular: () => <FaAngular className="h-14 w-14 text-red-600/80" />,
    React: () => <FaReact className="h-14 w-14 text-blue-500" />,
  }[project.framework] || (() => <FaReact className="h-14 w-14 text-blue-500" />);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-8">
      {deploymentStatus === "IN_PROGRESS" ? (
        <Skeleton className="w-full h-64 rounded" />
      ) : (
        <div className="w-full h-64 rounded flex items-center justify-center">
          <div className="flex items-center justify-center flex-col gap-2">
            <FrameworkIcon />
            <p>Your project is ready! 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
};