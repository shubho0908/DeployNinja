import { z } from "zod";

const RepositorySchema = z.object({
  name: z.string(),
  id: z.number(),
  full_name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  private: z.boolean(),
  default_branch: z.string(),
  updated_at: z.string(),
});

const EnvVarSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export type EnvVar = z.infer<typeof EnvVarSchema>;

export type Repository = z.infer<typeof RepositorySchema>;
