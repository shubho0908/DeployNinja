import { z } from "zod";

export const UserModel = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  profileImage: z.string(),
  isGithubConnected: z.boolean(),
  githubAccessToken: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserModel>;
