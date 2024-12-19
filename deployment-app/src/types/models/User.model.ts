import { z } from "zod";

export const UserModel = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  profileImage: z.string(),
  isGithubConnected: z.boolean(),
  githubAccessToken: z.string(),
});

export type User = z.infer<typeof UserModel>;
