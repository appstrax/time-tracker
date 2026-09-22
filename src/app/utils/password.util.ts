export const PASSWORD_REQUIREMENTS =
  'At least 8 characters, including 1 uppercase letter and 1 number.';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isPasswordValid(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}
