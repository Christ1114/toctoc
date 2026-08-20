// app/lib/validation/resetPasswordValidation.ts

export interface ResetPasswordFormErrors {
    password?: string;
    confirmPassword?: string;
  }
  
  export interface ResetPasswordValidationContent {
    passwordRequired: { value: string };
    passwordTooShort: { value: string };
    passwordTooLong: { value: string };
    passwordWeak: { value: string };
    confirmPasswordRequired: { value: string };
    passwordsDoNotMatch: { value: string };
  }
  
  const MIN_PASSWORD_LENGTH = 8;
  const MAX_PASSWORD_LENGTH = 72; // Limite bcrypt
  
  export function validateResetPassword(
    password: string,
    confirmPassword: string,
    content: ResetPasswordValidationContent
  ): ResetPasswordFormErrors {
    const errors: ResetPasswordFormErrors = {};
  
    // Validation du mot de passe
    if (!password) {
      errors.password = content.passwordRequired.value;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = content.passwordTooShort.value;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      errors.password = content.passwordTooLong.value;
    } else if (!isPasswordStrongEnough(password)) {
      errors.password = content.passwordWeak.value;
    }
  
    // Validation de la confirmation
    if (!confirmPassword) {
      errors.confirmPassword = content.confirmPasswordRequired.value;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = content.passwordsDoNotMatch.value;
    }
  
    return errors;
  }
  
  function isPasswordStrongEnough(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Au moins 3 des 4 critères
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]
      .filter(Boolean)
      .length;
    
    return criteriaCount >= 3;
  }
  
  export function hasResetPasswordErrors(
    errors: ResetPasswordFormErrors
  ): boolean {
    return Object.keys(errors).length > 0;
  }