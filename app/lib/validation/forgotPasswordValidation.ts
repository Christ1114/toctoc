// app/lib/validation/forgotPasswordValidation.ts

export interface ForgotPasswordFormErrors {
    email?: string;
  }
  
  export interface ValidationContent {
    emailWarning: {
      value: string;
    };
  }
  
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  /**
   * Valide un email pour le formulaire de mot de passe oublié
   */
  export function validateForgotPasswordEmail(
    email: string,
    content: ValidationContent
  ): ForgotPasswordFormErrors {
    const errors: ForgotPasswordFormErrors = {};
    const trimmedEmail = email.trim();
  
    if (!trimmedEmail) {
      errors.email = content.emailWarning.value;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = content.emailWarning.value;
    } else if (trimmedEmail.length > 254) {
      errors.email = content.emailWarning.value;
    }
  
    return errors;
  }
  
  /**
   * Vérifie si le formulaire contient des erreurs
   */
  export function hasForgotPasswordErrors(
    errors: ForgotPasswordFormErrors
  ): boolean {
    return Object.keys(errors).length > 0;
  }