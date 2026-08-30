"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { 
  Eye, EyeOff, Lock, AlertCircle, CheckCircle, 
  KeyRound, ArrowLeft, Shield, RefreshCw, Check,
  LogIn
} from 'lucide-react';
import Image from 'next/image';
import Img from "@/public/assets/pictures/masquote1.png";
import { 
  validateResetPassword,
  hasResetPasswordErrors,
  type ResetPasswordFormErrors,
} from "@/app/lib/validation/resetPasswordValidation";
import { resetPassword } from "@/app/lib/auth-client";
import Img1 from "@/public/assets/pictures/masquote4.webp";
interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordForm = () => {
  const t = useTranslations('resetPassword');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [resetData, setResetData] = useState<ResetPasswordData>({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  const validationContent = {
    passwordRequired: { value: t('errors.passwordRequired') },
    passwordTooShort: { value: t('errors.passwordTooShort') },
    passwordTooLong: { value: t('errors.passwordTooLong') },
    passwordWeak: { value: t('errors.passwordWeak') },
    confirmPasswordRequired: { value: t('errors.confirmPasswordRequired') },
    passwordsDoNotMatch: { value: t('errors.passwordsDoNotMatch') },
  };


  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score <= 2) {
      return { score, label: t('passwordStrength.weak'), color: 'text-red-500 bg-red-500' };
    } else if (score <= 4) {
      return { score, label: t('passwordStrength.medium'), color: 'text-yellow-500 bg-yellow-500' };
    } else if (score <= 5) {
      return { score, label: t('passwordStrength.good'), color: 'text-blue-500 bg-blue-500' };
    } else {
      return { score, label: t('passwordStrength.strong'), color: 'text-green-500 bg-green-500' };
    }
  };

  const handlePasswordChange = (value: string) => {
    setResetData({ ...resetData, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
    
   
    const newErrors = { ...errors };
    if (value.trim() === '') {
      newErrors.password = validationContent.passwordRequired.value;
    } else if (value.length < 8) {
      newErrors.password = validationContent.passwordTooShort.value;
    } else {
      delete newErrors.password;
    }
    
   
    if (resetData.confirmPassword && value !== resetData.confirmPassword) {
      newErrors.confirmPassword = validationContent.passwordsDoNotMatch.value;
    } else if (resetData.confirmPassword && value === resetData.confirmPassword) {
      delete newErrors.confirmPassword;
    }
    
    setErrors(newErrors);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setResetData({ ...resetData, confirmPassword: value });
    
    const newErrors = { ...errors };
    if (value.trim() === '') {
      newErrors.confirmPassword = validationContent.confirmPasswordRequired.value;
    } else if (value !== resetData.password) {
      newErrors.confirmPassword = validationContent.passwordsDoNotMatch.value;
    } else {
      delete newErrors.confirmPassword;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGlobalError('');

   
    const submitErrors = validateResetPassword(
      resetData.password,
      resetData.confirmPassword,
      validationContent
    );
    
    if (hasResetPasswordErrors(submitErrors)) {
      setErrors(submitErrors);
      setIsSubmitting(false);
      return;
    }

    
    if (!token) {
      setGlobalError(t('errors.invalidToken'));
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await resetPassword({
        token,
        newPassword: resetData.password,
      });

      if (error) {
        console.error('Erreur reset password:', error.message);
        setGlobalError(t('errors.resetFailed'));
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setGlobalError(t('errors.resetFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  
  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-4 px-3 ${orbitron.className}`}>
        <div className="w-full max-w-md mx-auto text-center">
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 ">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-black dark:text-zinc-300 mb-2">
              {t('invalidToken.title')}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {t('invalidToken.message')}
            </p>
            <Link 
              href="/forgotpassword"
              className="inline-flex items-center gap-2 text-[#432dd7] font-bold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToForgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6">
      <div className="w-full max-w-4xl mx-auto">
        <form 
          onSubmit={handleSubmit} 
          className={`w-full mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8 lg:px-10 text-black dark:text-zinc-300 rounded-lg ${orbitron.className}`}
        >
          {!isSuccess ? (
            <>
              <div className="mb-4 sm:mb-6 md:mb-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center overflow-hidden">
                  <Image src={Img} alt="Logo" width={100} height={100} />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                  {t('title')}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-zinc-500 dark:text-zinc-400 mt-1">
                  {t('subtitle')}
                </p>
              </div>

      
              <div className="mb-4 sm:mb-5 md:mb-6 flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-300">
                  {t('securityInfo')}
                </p>
              </div>

      
              {globalError && (
                <div className="mb-4 sm:mb-5 md:mb-6 flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-xs md:text-sm text-red-800 dark:text-red-300">
                    {globalError}
                  </p>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                
                <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px] sm:text-xs md:text-sm p-2 sm:p-2.5 md:p-3 flex items-center gap-1.5 sm:gap-2">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#432dd7]" />
                    <span>{t('labels.password')}</span>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={resetData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        placeholder={t('placeholders.password')}
                        className={`w-full border bg-white dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 text-[10px] sm:text-xs md:text-sm outline-none rounded-md transition-all ${
                          errors.password 
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        aria-label={showPassword ? t('buttons.hidePassword') : t('buttons.showPassword')}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                    
                    
                    {resetData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((index) => (
                            <div
                              key={index}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                index <= passwordStrength.score
                                  ? passwordStrength.color
                                  : 'bg-zinc-200 dark:bg-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] sm:text-xs font-bold ${passwordStrength.color.split(' ')[0]}`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                    
                    {errors.password && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                </div>

               
                <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px] sm:text-xs md:text-sm p-2 sm:p-2.5 md:p-3 flex items-center gap-1.5 sm:gap-2">
                    <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#432dd7]" />
                    <span>{t('labels.confirmPassword')}</span>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3">
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={resetData.confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        placeholder={t('placeholders.confirmPassword')}
                        className={`w-full border bg-white dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 text-[10px] sm:text-xs md:text-sm outline-none rounded-md transition-all ${
                          errors.confirmPassword 
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        aria-label={showConfirmPassword ? t('buttons.hidePassword') : t('buttons.showPassword')}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </button>
                    </div>
                    {resetData.confirmPassword === resetData.password && resetData.confirmPassword && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-green-500">
                        <Check className="w-3 h-3 shrink-0" />
                        {t('passwordsMatch')}
                      </p>
                    )}
                    {errors.confirmPassword && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !resetData.password || !resetData.confirmPassword}
                  className="cursor-pointer w-full bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-[10px] sm:text-xs md:text-sm px-6 py-2.5 sm:py-3 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md shadow-md hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  {isSubmitting ? t('buttons.loading') : t('buttons.submit')}
                </button>
              </div>

              <div className="mt-4 sm:mt-5 md:mt-6 text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-[#432dd7] font-bold hover:underline hover:underline-offset-2 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {t('backToLogin')}
                </Link>
              </div>
            </>
          ) : (
            <>
       
              <div className="mb-4 sm:mb-6 md:mb-8 text-center">
               <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-2 sm:mb-3 md:mb-4 bg-linear-to-br flex items-center justify-center shadow-lg">
                   <Image src={Img1} alt="Logo" width={100} height={100} />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-500">
                  {t('success.title')}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-2">
                  {t('success.message')}
                </p>
              </div>

              <div className="mt-4 sm:mt-5 md:mt-6 text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-[#432dd7] font-bold hover:underline hover:underline-offset-2 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {t('goToLogin')}
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;