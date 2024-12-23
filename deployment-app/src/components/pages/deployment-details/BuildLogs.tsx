"use client";

import { Loader2, OctagonXIcon, CheckCircle2 } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";

interface BuildLogEntry {
  timestamp: string;
  log: string;
}

interface BuildLogsSectionProps {
  buildLogs: BuildLogEntry[];
  isLoading: boolean;
  isPolling: boolean;
  latestDeployment: DeploymentModel | null;
}

const StatusIcon = ({ isLoading, isPolling, status }: { 
  isLoading: boolean;
  isPolling: boolean;
  status?: DeploymentStatus;
}) => (
  <div className="flex items-center gap-2 mr-1">
    {isLoading || isPolling ? (
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    ) : status === "FAILED" ? (
      <OctagonXIcon className="h-5 w-5 text-red-500" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-blue-500" />
    )}
  </div>
);

export function BuildLogsSection({ 
  buildLogs, 
  isLoading, 
  isPolling, 
  latestDeployment 
}: BuildLogsSectionProps) {
  return (
    <AccordionItem value="build-logs" className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
      <AccordionTrigger className="px-4 hover:no-underline border-b hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
        <div className="flex justify-between items-center w-full">
          <span>Build Logs</span>
          <StatusIcon 
            isLoading={isLoading} 
            isPolling={isPolling} 
            status={latestDeployment?.deploymentStatus} 
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-zinc-50 dark:bg-zinc-900/50">
        <div className="text-sm font-mono whitespace-pre-wrap space-y-1">
          {buildLogs
            ?.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((log, index) => (
              <div key={index} className="p-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="ml-2">{log.log.replace(/^\n/, "")}</span>
              </div>
            ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}