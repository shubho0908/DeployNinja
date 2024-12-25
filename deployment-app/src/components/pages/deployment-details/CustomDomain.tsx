"use client";

import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  OctagonXIcon,
  CheckCircle2,
} from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import EditSubdomainDialog from "@/components/EditSubDomainDialog";
import { Project } from "@/types/schemas/Project";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";

interface CustomDomainsSectionProps {
  project?: Project | null;
  latestDeployment: DeploymentModel | null;
  onSuccess: () => void;
}

const StatusIcon = ({
  status,
}: {
  status?: DeploymentStatus;
}) => (
  <div className="flex items-center gap-2 mr-1">
    {status === "IN_PROGRESS" ? (
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    ) : status === "FAILED" ? (
      <OctagonXIcon className="h-5 w-5 text-red-500" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-blue-500" />
    )}
  </div>
);

export function CustomDomainsSection({
  project,
  latestDeployment,
  onSuccess,
}: CustomDomainsSectionProps) {
  return (
    <AccordionItem
      disabled={latestDeployment?.deploymentStatus !== "READY"}
      value="custom-domains"
      className="border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30"
    >
      <AccordionTrigger className="px-4 hover:no-underline border-b hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
        <div className="flex justify-between items-center w-full">
          <span>Assigning Custom Domains</span>
          <StatusIcon
            status={latestDeployment?.deploymentStatus}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-zinc-50 dark:bg-zinc-900/50 p-4">
        <div className="space-y-2 flex items-center justify-between">
          <div className="domains">
            <div className="flex items-center justify-between rounded-md">
              <div className="flex items-center gap-2">
                <Link
                  href={`http://${project?.subDomain}.localhost:8000`}
                  target="_blank"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  {project?.subDomain}
                </Link>
                <ExternalLink className="h-4 w-4 text-zinc-500 dark:text-zinc-400 cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="editable">
            <EditSubdomainDialog
              projectId={project?.id!}
              deploymentId={latestDeployment?.id || ""}
              currentSubdomain={project?.subDomain || ""}
              onSuccess={onSuccess}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
