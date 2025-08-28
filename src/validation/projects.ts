import { z } from 'zod';

export const projectSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  budget: z.number().min(0, "Budget must be >= 0").optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  department: z.string().optional(),
  priority: z.string().optional(),
});

export type ProjectData = z.infer<typeof projectSchema>;