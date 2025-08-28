import { z } from 'zod';

export const taskSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().datetime().optional(),
  completed_date: z.string().datetime().optional(),
});

export type TaskData = z.infer<typeof taskSchema>;