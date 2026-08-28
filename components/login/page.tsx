"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { 
  Eye, EyeOff, Lock, Mail, AlertCircle, 
  CheckCircle, ChevronRight, KeyRound, LogIn
} from 'lucide-react';
import Image from 'next/image';
import Img from "@/public/assets/pictures/masquote1.png";
import { 
  isEmailValid, 
  LoginFormErrors 
} from "@/app/lib/validation/loginValidation";
import { signInWithEmail, signInWithGoogle, signInWithTikTok } from "@/app/lib/auth-client";

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginForm = () => {
  const t = useTranslations('login');
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationContent = {
    emailWarning: { value: t('errors.invalidEmail') },
    passwordWarning: { value: t('errors.invalidPassword') },
  };


  const handleEmailChange = (value: string) => {
    setLoginData({ ...loginData, email: value });
    if (value.trim() === '') {
      setErrors({ ...errors, email: validationContent.emailWarning.value });
    } else if (!isEmailValid(value)) {
      setErrors({ ...errors, email: validationContent.emailWarning.value });
    } else {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handlePasswordChange = (value: string) => {
    setLoginData({ ...loginData, password: value });
    if (value.trim() === '') {
      setErrors({ ...errors, password: validationContent.passwordWarning.value });
    } else {
      setErrors({ ...errors, password: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
 
    const submitErrors: LoginFormErrors = {};
    
    if (!isEmailValid(loginData.email)) {
      submitErrors.email = validationContent.emailWarning.value;
    }
    
    if (loginData.password.trim() === '') {
      submitErrors.password = validationContent.passwordWarning.value;
    }
    
    if (Object.values(submitErrors).some(Boolean)) {
      setErrors(submitErrors);
      setIsSubmitting(false);
      return;
    }
    
    try {
     
      const { result, error } = await signInWithEmail({
        email: loginData.email,
        password: loginData.password,
        rememberMe: loginData.rememberMe,
      });
      
      if (error) {
        console.error('Erreur connexion:', error.message);
        setErrors({ 
          ...errors, 
          password: t('errors.invalidCredentials') 
        });
      } else {
       
      
        window.location.href = '/preloading';
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    try {
      const { error: signInError } = await signInWithGoogle();
     
    } catch (err) {
     
    } finally {
      setIsLoading(null);
    }
  };
  
  const handleTikTokLogin = async () => {
    setIsLoading('tiktok');
    try {
      const { error: signInError } = await signInWithTikTok();
     
    } catch (err) {
      
    } finally {
      setIsLoading(null);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6">
      <div className="w-full max-w-4xl mx-auto">
        <form 
          onSubmit={handleSubmit} 
          className={`w-full mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8 lg:px-10  text-black dark:text-zinc-300 rounded-lg  ${orbitron.className}`}
        >
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

          <div className="space-y-3 sm:space-y-4 md:space-y-5">

            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px] sm:text-xs md:text-sm p-2 sm:p-2.5 md:p-3 flex items-center gap-1.5 sm:gap-2">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#432dd7]" />
                <span>{t('labels.email')}</span>
              </div>
              <div className="p-2 sm:p-2.5 md:p-3">
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={t('placeholders.email')}
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

         
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px] sm:text-xs md:text-sm p-2 sm:p-2.5 md:p-3 flex items-center gap-1.5 sm:gap-2">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#432dd7]" />
                <span>{t('labels.password')}</span>
              </div>
              <div className="p-2 sm:p-2.5 md:p-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
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
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 px-1">
              <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-zinc-300 dark:border-zinc-600 rounded focus:ring-[#432dd7] text-[#432dd7] shrink-0 cursor-pointer"
                />
                <span className="text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-300 transition-colors">
                  {t('labels.rememberMe')}
                </span>
              </label>
              <Link
                href="/forgotpassword" 
                className="text-[10px] sm:text-xs md:text-sm text-[#432dd7] hover:underline hover:underline-offset-2 transition-all"
              >
                {t('labels.forgotPassword')}
              </Link>
            </div>


            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-[10px] sm:text-xs md:text-sm px-6 py-2.5 sm:py-3 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 rounded-md shadow-md hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              {isSubmitting ? t('buttons.loading') : t('buttons.submit')}
            </button>
          </div>

  
          <div className="relative my-4 sm:my-5 md:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300 dark:border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px] sm:text-xs md:text-sm">
              <span className="px-3 sm:px-4 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                {t('divider')}
              </span>
            </div>
          </div>

    
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading === 'google'}
              className="w-full cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border-2 border-zinc-300 dark:border-zinc-600 hover:border-[#4285F4] dark:hover:border-[#4285F4] bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'google' ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {t('providers.google')}
              </span>
            </button>

  
            <button
              type="button"
              onClick={handleTikTokLogin}
              disabled={isLoading === 'tiktok'}
              className="w-full cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border-2 border-zinc-300 dark:border-zinc-600 hover:border-black dark:hover:border-white bg-white dark:bg-zinc-900 rounded-lg transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'tiktok' ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" viewBox="0 0 24 24">
                  <path className="fill-black dark:fill-white transition-colors" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              )}
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {t('providers.tiktok')}
              </span>
            </button>
          </div>

          <div className="mt-4 sm:mt-5 md:mt-6 text-center">
            <p className="text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
              {t('noAccount')}{' '}
              <Link href="/register" className="text-[#432dd7] font-bold hover:underline hover:underline-offset-2 transition-all">
      {t('registerLink')}
    </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;