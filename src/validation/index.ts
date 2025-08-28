import { z } from 'zod';
import { licenseSchema } from './licenses';
import { projectSchema } from './projects';
import { grantSchema } from './grants';
import { budgetSchema } from './budgets';
import { taskSchema } from './tasks';
import { institutionSchema } from './institutions';
import { activitySchema } from './activities';
import { planSchema } from './plans';

// Dataset validation registry
export const validationSchemas: Record<string, z.ZodSchema> = {
  'business_licenses': licenseSchema,
  'licenses': licenseSchema,
  'projects': projectSchema,
  'grants': grantSchema,
  'budgets': budgetSchema,
  'regular_budget': budgetSchema,
  'budget_authorizations': budgetSchema,
  'tasks': taskSchema,
  'institutions': institutionSchema,
  'activities': activitySchema,
  'plans': planSchema,
  'tabarim': budgetSchema,
  'collection_data': budgetSchema,
  'salary_data': budgetSchema,
};

export const validateRowData = (data: any, tableName: string): { isValid: boolean; error?: string } => {
  const schema = validationSchemas[tableName];
  
  if (!schema) {
    return { isValid: true }; // No validation schema available, pass through
  }
  
  try {
    schema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { isValid: false, error: errorMessages };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};