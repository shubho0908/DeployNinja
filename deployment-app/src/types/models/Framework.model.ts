import { z } from 'zod';

export const FrameworkSchema = z.object({
  name: z.string(),
});

export type Framework = z.infer<typeof FrameworkSchema>;
