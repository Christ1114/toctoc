
import { isEmailValid as emailValid } from "./registerValidation";

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

type ValidationContent = Record<string, { value: string }>;


export const isEmailValid = emailValid;


export function isPasswordValid(password: string): boolean {
  return password.trim().length > 0;
}

export function isPasswordRequired(password: string): boolean {
  return password.trim().length > 0;
}


export function validateLoginForm(
  data: Pick<LoginFormValues, "email" | "password">,
  content: ValidationContent
): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!data.email.trim()) {
    errors.email = content.emailRequiredWarning?.value ?? "L'email est requis.";
  } else if (!isEmailValid(data.email)) {
    errors.email = content.emailWarning?.value ?? "Adresse email invalide.";
  }

  if (!isPasswordValid(data.password)) {
    errors.password = content.passwordRequiredWarning?.value ?? "Le mot de passe est requis.";
  }

  return errors;
}

export function hasErrors(errors: LoginFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s+/g, "");
}