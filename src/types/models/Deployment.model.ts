import { z } from "zod";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";

export const DeploymentModel = z.object({
  id: z.string(),
  projectId: z.string(),
  subDomain: z.string(),
  customDomain: z.string().optional(),
  gitBranchName: z.string(),
  gitRepoUrl: z.string(),
  gitCommitHash: z.string(),
  gitCommitUrl: z.string(),
  deploymentStatus: DeploymentStatus,
  deploymentMessage: z.string().optional(),
});

export type DeploymentModel = z.infer<typeof DeploymentModel>;
