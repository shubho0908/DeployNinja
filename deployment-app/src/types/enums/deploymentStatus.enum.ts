import { z } from "zod";

export const DeploymentStatus = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY",
  "FAILED",
]);

export type DeploymentStatus = z.infer<typeof DeploymentStatus>;
