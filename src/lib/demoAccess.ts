export type DepartmentSlug = 'finance' | 'education' | 'engineering' | 'welfare' | 'non-formal' | 'business';

export type DemoUser = {
  email: string;
  password: string;
  role: 'mayor' | 'manager';
  departments: DepartmentSlug[];
  displayName: string;
};

export const DEMO_USERS: DemoUser[] = [
  { email: 'mayor@city.gov.il', password: 'Demo1234', role: 'mayor', departments: ['finance','education','engineering','welfare','non-formal','business'], displayName: 'ראש העיר' },
  { email: 'finance@city.gov.il', password: 'Demo1234', role: 'manager', departments: ['finance'], displayName: 'מנהל/ת פיננסים' },
  { email: 'education@city.gov.il', password: 'Demo1234', role: 'manager', departments: ['education'], displayName: 'מנהל/ת חינוך' },
  { email: 'engineering@city.gov.il', password: 'Demo1234', role: 'manager', departments: ['engineering'], displayName: 'מנהל/ת הנדסה' },
  { email: 'welfare@city.gov.il', password: 'Demo1234', role: 'manager', departments: ['welfare'], displayName: 'מנהל/ת רווחה' },
  { email: 'non-formal@city.gov.il', password: 'Demo1234', role: 'manager', departments: ['non-formal'], displayName: 'מנהל/ת חינוך בלתי פורמאלי' },
  { email: 'business@city.gov.il', password: 'Demo1234', role: 'manager', departments: ['business'], displayName: 'מנהל/ת רישוי עסקים' },
];

export function getAccessForEmail(email: string): { role: 'mayor' | 'manager'; departments: DepartmentSlug[] } | null {
  const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  return found ? { role: found.role, departments: found.departments } : null;
}

export function departmentFromPath(path: string): DepartmentSlug | null {
  const map: Record<string, DepartmentSlug> = {
    '/finance': 'finance',
    '/education': 'education',
    '/engineering': 'engineering',
    '/welfare': 'welfare',
    '/non-formal': 'non-formal',
    '/business': 'business',
  };
  return map[path] || null;
}
