import { z } from "zod";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";

export const DeploymentModel = z.object({
  id: z.string().optional(),
  projectId: z.string(),
  gitBranchName: z.string(),
  gitCommitHash: z.string().optional(),
  deploymentStatus: DeploymentStatus.default("NOT_STARTED"),
  deploymentMessage: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type DeploymentModel = z.infer<typeof DeploymentModel>;
