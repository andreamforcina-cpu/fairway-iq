export type AuthMode = 'register' | 'login';
export interface AuthFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

export function validateAuthForm(mode: AuthMode, values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};
  if (mode === 'register' && (!values.fullName.trim() || values.fullName.trim().length > 100 || /[\u0000-\u001f\u007f]/.test(values.fullName))) errors.fullName = 'Enter a name of 1–100 characters on one line.';
  const email = values.email.trim();
  if (/[\u0000-\u001f\u007f]/.test(email) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  // Login must accept existing passwords, rather than enforce registration policy.
  if (!values.password) errors.password = 'Enter your password.';
  else if (values.password.length > 128) errors.password = 'Password must be 128 characters or fewer.';
  else if (mode === 'register' && (values.password.length < 15 || !values.password.trim())) errors.password = 'Use 15–128 characters. Spaces and symbols are welcome.';
  if (mode === 'register' && (!values.confirmPassword || values.password !== values.confirmPassword)) errors.confirmPassword = 'Passwords must match.';
  return errors;
}
