

import { isEmailValid } from "./registerValidation";

export interface ForgotPasswordFormErrors {
  email?: string;
}

export interface ValidationContent {
  emailWarning: {
    value: string;
  };
}


export function validateForgotPasswordEmail(
  email: string,
  content: ValidationContent
): ForgotPasswordFormErrors {
  const errors: ForgotPasswordFormErrors = {};
  
  if (!email.trim() || !isEmailValid(email)) {
    errors.email = content.emailWarning.value;
  }

  return errors;
}


export function hasForgotPasswordErrors(
  errors: ForgotPasswordFormErrors
): boolean {
  return Object.keys(errors).length > 0;
}