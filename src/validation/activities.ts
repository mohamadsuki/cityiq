import { z } from 'zod';

export const activitySchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1, "Activity name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  participants: z.number().min(0, "Participants must be >= 0").optional(),
  status: z.string().optional(),
});

export type ActivityData = z.infer<typeof activitySchema>;