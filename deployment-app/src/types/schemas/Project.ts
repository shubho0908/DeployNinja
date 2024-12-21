import { z } from "zod";
import { DeploymentModel } from "./Deployment";

export const ProjectModel = z.object({
  id: z.string().optional(),
  name: z.string(),
  ownerId: z.string(),
  subDomain: z.string(),
  framework: z.string(),
  installCommand: z.string(),
  buildCommand: z.string(),
  projectRootDir: z.string(),
  gitRepoUrl: z.string(),
  deployments: z.array(DeploymentModel).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Project = z.infer<typeof ProjectModel>;
