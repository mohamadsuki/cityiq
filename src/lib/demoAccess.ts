export type DepartmentSlug = 'finance' | 'education' | 'engineering' | 'welfare' | 'non-formal' | 'business';

export type DemoUser = {
  email: string;
  password: string;
  role: 'mayor' | 'ceo' | 'manager';
  departments: DepartmentSlug[];
  displayName: string;
};

export const DEMO_USERS: DemoUser[] = [
  { email: 'mayor@city.gov.il', password: 'mayor123', role: 'mayor', departments: ['finance','education','engineering','welfare','non-formal','business'], displayName: 'ראש העיר' },
  { email: 'ceo@city.gov.il', password: 'ceo123', role: 'ceo', departments: ['finance','education','engineering','welfare','non-formal','business'], displayName: 'מנכ"ל העירייה' },
  { email: 'finance@city.gov.il', password: 'finance123', role: 'manager', departments: ['finance'], displayName: 'מנהל/ת פיננסים' },
  { email: 'education@city.gov.il', password: 'education123', role: 'manager', departments: ['education'], displayName: 'מנהל/ת חינוך' },
  { email: 'engineering@city.gov.il', password: 'engineering123', role: 'manager', departments: ['engineering'], displayName: 'מנהל/ת הנדסה' },
  { email: 'welfare@city.gov.il', password: 'welfare123', role: 'manager', departments: ['welfare'], displayName: 'מנהל/ת רווחה' },
  { email: 'non-formal@city.gov.il', password: 'nonformal123', role: 'manager', departments: ['non-formal'], displayName: 'מנהל/ת חינוך בלתי פורמאלי' },
  { email: 'business@city.gov.il', password: 'business123', role: 'manager', departments: ['business'], displayName: 'מנהל/ת רישוי עסקים' },
];

export function getAccessForEmail(email: string): { role: 'mayor' | 'ceo' | 'manager'; departments: DepartmentSlug[] } | null {
  const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) return { role: found.role, departments: found.departments };
  // Fallback: match by simple username (ignore domain) to support demo signups like mayor@example.com
  const uname = simpleUsernameFromEmail(email);
  const byUser = DEMO_USERS.find(u => simpleUsernameFromEmail(u.email) === uname);
  return byUser ? { role: byUser.role, departments: byUser.departments } : null;
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

export function simpleUsernameFromEmail(email: string): string {
  const prefix = email.split('@')[0] || '';
  return prefix.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function emailForUsername(username: string): string | null {
  const norm = username.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const found = DEMO_USERS.find(u => simpleUsernameFromEmail(u.email) === norm);
  return found ? found.email : null;
}
