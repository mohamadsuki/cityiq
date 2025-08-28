import { z } from 'zod';

export const planSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1, "Plan name is required"),
  plan_number: z.string().optional(),
  status: z.string().optional(),
  land_use: z.string().optional(),
  address: z.string().optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
});

export type PlanData = z.infer<typeof planSchema>;