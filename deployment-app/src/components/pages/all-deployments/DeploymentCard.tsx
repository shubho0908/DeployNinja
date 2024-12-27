import Link from "next/link";
import { Geist_Mono } from "next/font/google";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { formatTimeAgo } from "@/utils/formatDate";
import { DeploymentStatus } from "./DeploymentStatus";
import { DeploymentMeta } from "./DeploymentMeta";
import BlurFade from "@/components/ui/blur-fade";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

interface DeploymentCardProps {
  deployment: DeploymentModel;
  index: number;
  user: {
    profileImage?: string;
    name?: string;
    username?: string;
  };
}

export function DeploymentCard({ deployment, index, user }: DeploymentCardProps) {
  return (
    <BlurFade key={deployment.id} delay={0.25 + index * 0.05} inView>
      <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Link
              href={`/deployments/${deployment.id}`}
              className={`text-sm ${geistMono.className} text-blue-600 dark:text-blue-400 hover:underline`}
            >
              {deployment.id?.slice(0, 7)}
            </Link>
            <DeploymentStatus status={deployment.deploymentStatus} />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {deployment.createdAt &&
                formatTimeAgo(new Date(deployment.createdAt))}
            </span>
          </div>
          <DeploymentMeta deployment={deployment} isLatest={index === 0} />
        </div>
        <div className="flex items-center gap-2">
          <img
            src={user?.profileImage ?? ""}
            alt={user?.name ?? "User"}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {deployment.createdAt &&
              formatTimeAgo(new Date(deployment.createdAt))}{" "}
            by {user?.username}
          </span>
        </div>
      </div>
    </BlurFade>
  );
}