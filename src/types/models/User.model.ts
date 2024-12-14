import { z } from "zod";

export const UserModel = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  profileImage: z.string(),
  isGithubConnected: z.boolean(),
});

export type User = z.infer<typeof UserModel>;
