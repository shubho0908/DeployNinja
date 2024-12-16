import { z } from "zod";
import { DeploymentModel } from "./Deployment.model";
import { FrameworkSchema } from "./Framework.model";

export const ProjectModel = z.object({
  name: z.string(),
  ownerId: z.string(),
  framework: FrameworkSchema,
  installCommand: z.string(),
  buildCommand: z.string(),
  projectRootDir: z.string(),
  gitRepoUrl: z.string(),
  deployments: z.array(DeploymentModel).optional(),
});

export type Project = z.infer<typeof ProjectModel>;
