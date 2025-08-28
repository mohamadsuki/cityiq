import { z } from 'zod';

export const institutionSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1, "Institution name is required"),
  type: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  capacity: z.number().min(0, "Capacity must be >= 0").optional(),
  status: z.string().optional(),
});

export type InstitutionData = z.infer<typeof institutionSchema>;