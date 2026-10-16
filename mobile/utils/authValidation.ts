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
  // Python validates Unicode code points, rather than JavaScript UTF-16 units.
  const passwordLength = Array.from(values.password).length;
  if (mode === 'register' && (!values.fullName.trim() || Array.from(values.fullName.trim()).length > 100 || /\p{C}/u.test(values.fullName))) errors.fullName = 'Enter a name of 1–100 characters on one line.';
  const email = values.email.trim();
  if (/[\u0000-\u001f\u007f]/.test(email) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  // Login must accept existing passwords, rather than enforce registration policy.
  if (!values.password) errors.password = 'Enter your password.';
  else if (/\p{Cs}/u.test(values.password)) errors.password = 'Enter a valid Unicode password.';
  else if (passwordLength > 128) errors.password = 'Password must be 128 characters or fewer.';
  // Python str.isspace includes U+001C–001F, but excludes the JS trim BOM U+FEFF.
  else if (mode === 'register' && (passwordLength < 15 || /^[\p{White_Space}\u001c-\u001f]+$/u.test(values.password))) errors.password = 'Use 15–128 characters. Spaces and symbols are welcome.';
  if (mode === 'register' && (!values.confirmPassword || values.password !== values.confirmPassword)) errors.confirmPassword = 'Passwords must match.';
  return errors;
}
