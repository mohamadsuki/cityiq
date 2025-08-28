import { z } from 'zod';

export const licenseSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  status: z.string().optional(),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  license_type: z.string().optional(),
  fee_amount: z.number().min(0, "Fee amount must be >= 0").optional(),
  notes: z.string().optional(),
});

export type LicenseData = z.infer<typeof licenseSchema>;