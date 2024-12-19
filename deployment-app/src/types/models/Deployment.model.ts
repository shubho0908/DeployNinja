import { z } from "zod";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";

export const DeploymentModel = z.object({
  id: z.string(),
  projectId: z.string(),
  gitBranchName: z.string(),
  gitCommitHash: z.string(),
  deploymentStatus: DeploymentStatus.optional(),
  deploymentMessage: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
});

export type DeploymentModel = z.infer<typeof DeploymentModel>;
