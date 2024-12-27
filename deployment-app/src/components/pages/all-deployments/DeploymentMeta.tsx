import { GitBranch } from "lucide-react";
import { Geist_Mono } from "next/font/google";
import { DeploymentModel } from "@/types/schemas/Deployment";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

interface DeploymentMetaProps {
  deployment: DeploymentModel;
  isLatest: boolean;
}

export function DeploymentMeta({ deployment, isLatest }: DeploymentMetaProps) {
  return (
    <div className="mt-2 flex items-center gap-4">
      {isLatest && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            Current
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-zinc-400" />
        <span className={`text-sm ${geistMono.className}`}>
          {deployment.gitBranchName || "main"}
        </span>
        <span className="text-zinc-400">
          {deployment.gitCommitHash?.slice(0, 7)}
        </span>
      </div>
    </div>
  );
}