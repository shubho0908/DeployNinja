import { z } from "zod";
import { DeploymentModel } from "./Deployment.model";
import { FrameworkSchema } from "./Framework.model";

export const ProjectModel = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  framework: FrameworkSchema,
  deployments: z.array(DeploymentModel),
});

export type Project = z.infer<typeof ProjectModel>;
