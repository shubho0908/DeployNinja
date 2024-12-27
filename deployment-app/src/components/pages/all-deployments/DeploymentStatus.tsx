import { DeploymentModel } from "@/types/schemas/Deployment";

interface DeploymentStatusProps {
  status: DeploymentModel["deploymentStatus"];
}

export function DeploymentStatus({ status }: DeploymentStatusProps) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "READY"
            ? "bg-green-500"
            : status === "IN_PROGRESS"
            ? "bg-yellow-500"
            : "bg-red-500"
        }`}
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{status}</span>
    </span>
  );
}
