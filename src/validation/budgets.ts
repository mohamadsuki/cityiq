import { z } from 'zod';

export const budgetSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  created_at: z.string().datetime().optional(),
  budget_year: z.number().min(2000, "Budget year must be valid").max(2100),
  department: z.string().min(1, "Department is required"),
  category: z.string().optional(),
  allocated_amount: z.number().min(0, "Allocated amount must be >= 0"),
  spent_amount: z.number().min(0, "Spent amount must be >= 0").optional(),
  remaining_amount: z.number().min(0, "Remaining amount must be >= 0").optional(),
  description: z.string().optional(),
});

export type BudgetData = z.infer<typeof budgetSchema>;