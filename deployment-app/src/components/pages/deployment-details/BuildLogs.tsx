"use client";

import { Loader2, OctagonXIcon, CheckCircle2 } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { Geist_Mono } from "next/font/google";

interface BuildLogEntry {
  timestamp: string;
  log: string;
}

interface BuildLogsSectionProps {
  isLoading: boolean;
  buildLogs: BuildLogEntry[];
  latestDeployment: DeploymentModel | null;
}

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const StatusIcon = ({
  status,
  isLoading,
}: {
  status?: DeploymentStatus;
  isLoading?: boolean;
}) => (
  <div className="flex items-center gap-2 mr-1">
    {status === "IN_PROGRESS" || isLoading ? (
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    ) : status === "FAILED" ? (
      <OctagonXIcon className="h-5 w-5 text-red-500" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    )}
  </div>
);

export function BuildLogsSection({
  isLoading,
  buildLogs,
  latestDeployment,
}: BuildLogsSectionProps) {
  return (
    <AccordionItem
      value="build-logs"
      className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 backdrop:blur-lg"
    >
      <AccordionTrigger className="px-4 hover:no-underline border-b hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
        <div className="flex justify-between items-center w-full">
          <span>Build Logs</span>
          <StatusIcon
            isLoading={isLoading}
            status={latestDeployment?.deploymentStatus}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent
        className={`bg-zinc-50 dark:bg-black/40 max-h-[400px] overflow-y-auto ${geistMono.className}`}
      >
        <div className="text-sm whitespace-pre-wrap space-y-1">
          {(buildLogs.length === 0 &&
            latestDeployment?.deploymentStatus === "READY") ||
          (buildLogs.length === 0 &&
            latestDeployment?.deploymentStatus === "IN_PROGRESS") ? (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              Please wait, we are fetching your logs...
            </div>
          ) : buildLogs.length === 0 &&
            latestDeployment?.deploymentStatus === "FAILED" ? (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              Sorry, we couldn't fetch your logs. Please try again later.
            </div>
          ) : (
            buildLogs
              .sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              )
              .map((log, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                >
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="ml-2">{log.log.replace(/^\n/, "")}</span>
                </div>
              ))
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
