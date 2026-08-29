

import { 
  isPasswordValid, 
  isPasswordConfirmed,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH
} from "./registerValidation";

export interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
}

export interface ResetPasswordValidationContent {
  passwordRequired: { value: string };
  passwordWeak: { value: string };
  confirmPasswordRequired: { value: string };
  passwordsDoNotMatch: { value: string };
}



export function validateResetPassword(
  password: string,
  confirmPassword: string,
  content: ResetPasswordValidationContent
): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  
  if (!password) {
    errors.password = content.passwordRequired.value;
  } else if (!isPasswordValid(password)) {
    errors.password = content.passwordWeak.value;
  }


  if (!confirmPassword) {
    errors.confirmPassword = content.confirmPasswordRequired.value;
  } else if (!isPasswordConfirmed(password, confirmPassword)) {
    errors.confirmPassword = content.passwordsDoNotMatch.value;
  }

  return errors;
}
export function hasResetPasswordErrors(
  errors: ResetPasswordFormErrors
): boolean {
  return Object.keys(errors).length > 0;
}