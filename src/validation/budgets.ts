import { z } from 'zod';

export const budgetSchema = z.object({
  year: z.number().min(2000, "Year must be valid").max(2100),
  category_type: z.string().min(1, "Category type is required"),
  category_name: z.string().min(1, "Category name is required"),
  budget_amount: z.number().min(0, "Budget amount must be >= 0").optional(),
  actual_amount: z.number().min(0, "Actual amount must be >= 0").optional(),
  cumulative_execution: z.number().min(0, "Cumulative execution must be >= 0").optional(),
});

export type BudgetData = z.infer<typeof budgetSchema>;