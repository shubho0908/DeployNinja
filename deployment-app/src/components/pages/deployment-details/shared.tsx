import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { toast } from "sonner";

export type StatusColors = {
  [key in DeploymentStatus]: string;
};

export type LoadingState = {
  isLoading: boolean;
  hasError: boolean;
  isInitialized: boolean;
};

export const handleCopyUrl = (domain: string) => {
  navigator.clipboard.writeText(`http://${domain}`);
  toast.success("Copied to clipboard");
};

export const StatusIndicator = ({ status }: { status: DeploymentStatus }) => {
  const statusColors: StatusColors = {
    READY: "bg-green-500",
    FAILED: "bg-red-500",
    IN_PROGRESS: "bg-yellow-500",
    NOT_STARTED: "bg-gray-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <span className="text-sm">
        {status === "IN_PROGRESS" ? "IN PROGRESS" : status}
      </span>
    </div>
  );
};