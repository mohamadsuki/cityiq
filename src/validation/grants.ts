import { z } from 'zod';

export const grantSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  applicant_name: z.string().min(1, "Applicant name is required"),
  amount: z.number().min(0, "Amount must be >= 0"),
  purpose: z.string().optional(),
  status: z.string().optional(),
  application_date: z.string().datetime().optional(),
  approval_date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type GrantData = z.infer<typeof grantSchema>;