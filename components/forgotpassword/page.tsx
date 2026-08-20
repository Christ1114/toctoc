"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { 
  Mail, ArrowLeft, Send, CheckCircle, AlertCircle, 
  Shield, Clock, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import Img from "@/public/assets/pictures/fgM.webp";
import {
  validateForgotPasswordEmail,
  hasForgotPasswordErrors,
  type ForgotPasswordFormErrors,
} from "@/app/lib/validation/forgotPasswordValidation";
import { forgotPassword } from "@/app/lib/auth-client";

const ForgotPasswordForm = () => {
  const t = useTranslations('forgotPassword');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const validationContent = {
    emailWarning: { value: t('errors.invalidEmail') },
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim() === '') {
      setErrors({ email: validationContent.emailWarning.value });
    } else {
      const stepErrors = validateForgotPasswordEmail(value, validationContent);
      setErrors(stepErrors);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitErrors = validateForgotPasswordEmail(email, validationContent);
    if (hasForgotPasswordErrors(submitErrors)) {
      setErrors(submitErrors);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: requestError } = await forgotPassword(email);

      if (requestError) {
       
        console.error('Erreur demande reset:', requestError);
        setError(t('errors.sendFailed'));
      } else {
        setIsSubmitted(true);
        startResendTimer();
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setError(t('errors.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: requestError } = await forgotPassword(email);

      if (requestError) {
        console.error('Erreur renvoi:', requestError);
        setError(t('errors.resendFailed'));
      } else {
        startResendTimer();
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setError(t('errors.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <div 
          className={`w-full mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8 lg:px-10  text-black dark:text-zinc-300 rounded-lg  ${orbitron.className}`}
        >
          {!isSubmitted ? (
            <>
              <div className="mb-4 sm:mb-6 md:mb-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-2 sm:mb-3 md:mb-4  rounded-full flex items-center justify-center">
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
                  {t('info')}
                </p>
              </div>

              {error && (
                <div className="mb-4 sm:mb-5 md:mb-6 flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-xs md:text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-3 sm:space-y-4 md:space-y-5">

                  <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px] sm:text-xs md:text-sm p-2 sm:p-2.5 md:p-3 flex items-center gap-1.5 sm:gap-2">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#432dd7]" />
                      <span>{t('labels.email')}</span>
                    </div>
                    <div className="p-2 sm:p-2.5 md:p-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder={t('placeholders.email')}
                        aria-invalid={Boolean(errors.email)}
                        className={`w-full border bg-white dark:bg-zinc-900 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm outline-none rounded-md transition-all ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email || Boolean(errors.email)}
                    className="w-full bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-[10px] sm:text-xs md:text-sm px-6 py-2.5 sm:py-3 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md shadow-md hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    {isLoading ? t('buttons.sending') : t('buttons.submit')}
                  </button>
                </div>
              </form>

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
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-2 sm:mb-3 md:mb-4 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-500">
                  {t('success.title')}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-2">
                  {t('success.message')}
                </p>
              </div>

              <div className="mb-4 sm:mb-5 md:mb-6 flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#432dd7] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {t('success.sentTo')}
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 break-all">
                    {email}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 sm:mb-5 md:mb-6 flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-xs md:text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading || resendTimer > 0}
                className="w-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] sm:text-xs md:text-sm px-6 py-2.5 sm:py-3 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                {resendTimer > 0 
                  ? t('buttons.resendIn', { seconds: resendTimer })
                  : t('buttons.resend')}
              </button>

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
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;