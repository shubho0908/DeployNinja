import { z } from "zod";
import { DeploymentModel } from "./Deployment.model";

export const ProjectModel = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  framework: z.string(),
  installCommand: z.string(),
  buildCommand: z.string(),
  projectRootDir: z.string(),
  gitRepoUrl: z.string(),
  deployments: z.array(DeploymentModel).optional(),
});

export type Project = z.infer<typeof ProjectModel>;
