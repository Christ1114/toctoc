"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { 
  Eye, EyeOff, Lock, Mail, Phone, User, Shield, AlertCircle, 
  CheckCircle, Briefcase, Building2, ChevronLeft, ChevronRight,
  BadgeCheck, MapPin, ShieldOff, Glasses
} from 'lucide-react';
import Img1 from "@/public/assets/pictures/Mstep1.webp";
import Img2 from "@/public/assets/pictures/Mstep2.webp";
import Img3 from "@/public/assets/pictures/Mstep3.webp";
import Image from 'next/image';
import { 
  validateStep1, 
  validateStep2, 
  validateStep3,
  hasErrors,
  RegisterFormErrors,
  isNameValid,
  isEmailValid,
  isPhoneValid,
  isValidCountryCode,
  isPasswordValid,
  isPasswordConfirmed,
  isCompanyNameValid,
  isRccmValid
} from "@/app/lib/validation/registerValidation";


type Role = 'CLIENT' | 'PROVIDER';
type ClientType = 'INDIVIDUAL' | 'AGENCY';

type ProviderType = 'SALON' | 'FREELANCE' | 'SHOP';

interface Step1Data {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptLocation: boolean;
  acceptNoVpn: boolean;
  acceptVr: boolean;
}

interface Step2Data {
  role: Role;
  clientType?: ClientType;
  companyName?: string;
  rccmNumber?: string;
  providerType?: ProviderType;
  bio?: string;
}

interface Step3Data {
  verificationMethod: 'email' | 'phone';
  acceptNewsletter: boolean;
}

const RegisterForm = () => {
  const t = useTranslations('register');
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detectedOperator, setDetectedOperator] = useState<string | null>(null);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  
  const [step1Data, setStep1Data] = useState<Step1Data>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptLocation: false,
    acceptNoVpn: false,
    acceptVr: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [step2Data, setStep2Data] = useState<Step2Data>({
    role: 'CLIENT'
  });
  
  const [step3Data, setStep3Data] = useState<Step3Data>({
    verificationMethod: 'email',
    acceptNewsletter: false
  });

  const validationContent = {
    nameWarning: { value: t('errors.nameRequired') },
    emailWarning: { value: t('errors.invalidEmail') },
    phoneNumberWarning: { value: t('errors.invalidPhone') },
    passwordWarning: { value: t('errors.weakPassword') },
    confirmPasswordWarning: { value: t('errors.passwordMismatch') },
    termsWarning: { value: t('errors.acceptTerms') },
    locationWarning: { value: t('errors.acceptLocation') },
    noVpnWarning: { value: t('errors.acceptNoVpn') },
    vrWarning: { value: t('errors.acceptVr') },
    companyNameWarning: { value: t('errors.companyNameRequired') },
    rccmNumberWarning: { value: t('errors.invalidRccm') },
    phoneCountryCodeWarning: { value: t('errors.phoneCountryCodeWarning') }
  };

  const handleNameChange = (value: string) => {
    setStep1Data({ ...step1Data, name: value });
    if (value.trim() === '' || !isNameValid(value)) {
      setErrors({ ...errors, name: validationContent.nameWarning.value });
    } else {
      setErrors({ ...errors, name: undefined });
    }
  };

  const handleEmailChange = (value: string) => {
    setStep1Data({ ...step1Data, email: value });
    if (value.trim() === '' || !isEmailValid(value)) {
      setErrors({ ...errors, email: validationContent.emailWarning.value });
    } else {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handlePhoneChange = async (value: string) => {
    setStep1Data({ ...step1Data, phone: value });
    setDetectedOperator(null);
    
    if (value.trim() === '') {
      setErrors({ ...errors, phone: validationContent.phoneNumberWarning.value });
      return;
    }
    
    if (!value.startsWith("+225")) {
      setErrors({ ...errors, phone: validationContent.phoneNumberWarning.value });
      return;
    }
    
    if (!isPhoneValid(value)) {
      setErrors({ ...errors, phone: validationContent.phoneNumberWarning.value });
      return;
    }
    
    if (!isValidCountryCode(value)) {
      setErrors({ ...errors, phone: validationContent.phoneCountryCodeWarning.value });
      return;
    }
    
    const cleanedLength = value.replace(/\D/g, "").length;
    if (value.startsWith("+225") && cleanedLength === 13) {
      setIsVerifyingPhone(true);
      try {
        const response = await fetch('/api/numberdetection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: value }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setDetectedOperator(data.operator);
          setErrors({ ...errors, phone: undefined });
        } else {
          setDetectedOperator(null);
          setErrors({ ...errors, phone: data.error || "Numéro invalide." });
        }
      } catch (err) {
        console.error("Erreur vérification:", err);
        setDetectedOperator(null);
      } finally {
        setIsVerifyingPhone(false);
      }
    }
  };

  const handlePasswordChange = (value: string) => {
    setStep1Data({ ...step1Data, password: value });
    if (value === '' || !isPasswordValid(value)) {
      setErrors({ ...errors, password: validationContent.passwordWarning.value });
    } else {
      setErrors({ ...errors, password: undefined });
    }
    
    if (step1Data.confirmPassword) {
      if (value !== step1Data.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: validationContent.confirmPasswordWarning.value }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setStep1Data({ ...step1Data, confirmPassword: value });
    if (value === '' || !isPasswordConfirmed(step1Data.password, value)) {
      setErrors({ ...errors, confirmPassword: validationContent.confirmPasswordWarning.value });
    } else {
      setErrors({ ...errors, confirmPassword: undefined });
    }
  };

  const handleAcceptTermsChange = (checked: boolean) => {
    setStep1Data({ ...step1Data, acceptTerms: checked });
    setErrors({ ...errors, acceptTerms: checked ? undefined : validationContent.termsWarning.value });
  };

  const handleAcceptLocationChange = (checked: boolean) => {
    setStep1Data({ ...step1Data, acceptLocation: checked });
    setErrors({ ...errors, acceptLocation: checked ? undefined : validationContent.locationWarning.value });
  };

  const handleAcceptNoVpnChange = (checked: boolean) => {
    setStep1Data({ ...step1Data, acceptNoVpn: checked });
    setErrors({ ...errors, acceptNoVpn: checked ? undefined : validationContent.noVpnWarning.value });
  };

  const handleAcceptVrChange = (checked: boolean) => {
    setStep1Data({ ...step1Data, acceptVr: checked });
    setErrors({ ...errors, acceptVr: checked ? undefined : validationContent.vrWarning.value });
  };

  const handleCompanyNameChange = (value: string) => {
    setStep2Data({ ...step2Data, companyName: value });
    if (value.trim() === '' || !isCompanyNameValid(value)) {
      setErrors({ ...errors, companyName: validationContent.companyNameWarning.value });
    } else {
      setErrors({ ...errors, companyName: undefined });
    }
  };

  const handleRccmChange = (value: string) => {
    setStep2Data({ ...step2Data, rccmNumber: value });
    if (value.trim() === '' || !isRccmValid(value)) {
      setErrors({ ...errors, rccmNumber: validationContent.rccmNumberWarning.value });
    } else {
      setErrors({ ...errors, rccmNumber: undefined });
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors = validateStep1(step1Data, validationContent);
    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors = validateStep2(step2Data, validationContent);
    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    const allErrors = {
      ...validateStep1(step1Data, validationContent),
      ...validateStep2(step2Data, validationContent),
    };
    
    if (hasErrors(allErrors)) {
      setErrors(allErrors);
      setIsSubmitting(false);
      return;
    }
    
    if (!validateStep3(step3Data, step1Data.phone !== '')) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: step1Data.name,
          email: step1Data.email,
          phone: step1Data.phone,
          password: step1Data.password,
          accountType: step2Data.role,
          clientType: step2Data.clientType, // déjà "INDIVIDUAL" | "AGENCY", plus besoin de mapping
          companyName: step2Data.companyName,
          rccmNumber: step2Data.rccmNumber,
          providerType: step2Data.providerType,
          bio: step2Data.bio,
          consents: {
            TERMS_OF_USE: step1Data.acceptTerms,
            LOCATION_ACCESS: step1Data.acceptLocation,
            NO_VPN: step1Data.acceptNoVpn,
            VR_CONFERENCE: step1Data.acceptVr,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur serveur:', errorData);
        setSubmitError(errorData?.message ?? t('errors.submitFailed'));
      } else {
        console.log('Inscription réussie');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setSubmitError(t('errors.networkFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ProgressBar = () => (
    <div className={`w-full max-w-4xl mx-auto mb-4 sm:mb-6 px-3 sm:px-6 md:px-8 ${orbitron.className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-bold">
          {t('progress.step')} {currentStep}/3
        </span>
        <span className="text-[10px] sm:text-xs md:text-sm text-zinc-500">
          {currentStep === 1 ? t('progress.step1Title') : 
           currentStep === 2 ? t('progress.step2Title') : 
           t('progress.step3Title')}
        </span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 sm:h-2 flex-1 rounded-full transition-all ${
              step < currentStep 
                ? 'bg-green-600' 
                : step === currentStep 
                ? 'bg-[#432dd7]' 
                : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 px-2 sm:px-4">
      <ProgressBar />
      
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className={`w-full max-w-4xl mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8  text-black dark:text-zinc-300 ${orbitron.className}`}>
          <div className="mb-4 sm:mb-6 text-center">
            <Image
              src={Img1}
              alt="Step 1"
              width={80}
              height={80}
              className="mx-auto mb-2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
            />
            <h2 className="text-lg sm:text-xl font-bold">{t('step1.title')}</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{t('step1.subtitle')}</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Nom */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                <span>{t('labels.name')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <input
                  type="text"
                  value={step1Data.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('placeholders.name')}
                  className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none rounded-md transition-all ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t('labels.email')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <input
                  type="email"
                  value={step1Data.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={t('placeholders.email')}
                  className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none rounded-md transition-all ${
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

            {/* Téléphone avec vérification API */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{t('labels.phone')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <input
                  type="tel"
                  value={step1Data.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+2250707070707"
                  className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none rounded-md transition-all ${
                    errors.phone 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                  }`}
                />
                {isVerifyingPhone && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-blue-500">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {detectedOperator && !errors.phone && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 shrink-0" />
                    {detectedOperator}
                  </p>
                )}
                {errors.phone && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{t('labels.password')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={step1Data.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    autoComplete="new-password"
                    placeholder={t('placeholders.password')}
                    className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 pr-10 text-xs sm:text-sm outline-none rounded-md transition-all ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            {/* Confirmation */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{t('labels.confirmPassword')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={step1Data.confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    autoComplete="new-password"
                    placeholder={t('placeholders.confirmPassword')}
                    className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 pr-10 text-xs sm:text-sm outline-none rounded-md transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                        : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7] focus:ring-2 focus:ring-[#432dd7]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{t('labels.terms')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step1Data.acceptTerms}
                    onChange={(e) => handleAcceptTermsChange(e.target.checked)}
                    className="mt-1 w-4 h-4 border-zinc-300 dark:border-zinc-600 rounded focus:ring-[#432dd7] text-[#432dd7] shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {t('terms.accept')}{' '}
                    <a href="/policy" className="text-[#432dd7] hover:underline">
                      {t('terms.link')}
                    </a>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.acceptTerms}
                  </p>
                )}
              </div>
            </div>

            {/* Localisation */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{t('labels.location')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step1Data.acceptLocation}
                    onChange={(e) => handleAcceptLocationChange(e.target.checked)}
                    className="mt-1 w-4 h-4 border-zinc-300 dark:border-zinc-600 rounded focus:ring-[#432dd7] text-[#432dd7] shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {t('consents.location')}
                  </span>
                </label>
                {errors.acceptLocation && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.acceptLocation}
                  </p>
                )}
              </div>
            </div>

            {/* Non-utilisation de VPN */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <ShieldOff className="w-4 h-4 shrink-0" />
                <span>{t('labels.noVpn')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step1Data.acceptNoVpn}
                    onChange={(e) => handleAcceptNoVpnChange(e.target.checked)}
                    className="mt-1 w-4 h-4 border-zinc-300 dark:border-zinc-600 rounded focus:ring-[#432dd7] text-[#432dd7] shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {t('consents.noVpn')}
                  </span>
                </label>
                {errors.acceptNoVpn && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.acceptNoVpn}
                  </p>
                )}
              </div>
            </div>

            {/* Conférences VR */}
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Glasses className="w-4 h-4 shrink-0" />
                <span>{t('labels.vr')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step1Data.acceptVr}
                    onChange={(e) => handleAcceptVrChange(e.target.checked)}
                    className="mt-1 w-4 h-4 border-zinc-300 dark:border-zinc-600 rounded focus:ring-[#432dd7] text-[#432dd7] shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {t('consents.vr')}
                  </span>
                </label>
                {errors.acceptVr && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.acceptVr}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-zinc-300 dark:border-zinc-700">
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold border border-zinc-300 dark:border-zinc-600 text-zinc-400 cursor-not-allowed rounded-md"
            >
              {t('navigation.previous')}
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-zinc-500">
                {t('navigation.step')} 1/3
              </span>
              <button
                type="submit"
                className="bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-xs sm:text-sm px-6 sm:px-10 py-2.5 sm:py-3 transition-colors flex items-center gap-2 rounded-md"
              >
                {t('navigation.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit} className={`w-full max-w-4xl mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8  text-black dark:text-zinc-300 ${orbitron.className}`}>
          <div className="mb-4 sm:mb-6 text-center">
            <Image
              src={Img2}
              alt="Step 2"
              width={80}
              height={80}
              className="mx-auto mb-2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
            />
            <h2 className="text-lg sm:text-xl font-bold">{t('step2.title')}</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{t('step2.subtitle')}</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                <span>{t('labels.role')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep2Data({ ...step2Data, role: 'CLIENT' })}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      step2Data.role === 'CLIENT'
                        ? 'border-[#432dd7] bg-[#432dd7]/5'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    <User className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
                    <span className="block text-xs sm:text-sm font-bold">{t('roles.client')}</span>
                    <span className="block text-[10px] sm:text-xs text-zinc-500 mt-1">{t('roles.clientDesc')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep2Data({ ...step2Data, role: 'PROVIDER' })}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      step2Data.role === 'PROVIDER'
                        ? 'border-[#432dd7] bg-[#432dd7]/5'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
                    <span className="block text-xs sm:text-sm font-bold">{t('roles.provider')}</span>
                    <span className="block text-[10px] sm:text-xs text-zinc-500 mt-1">{t('roles.providerDesc')}</span>
                  </button>
                </div>
              </div>
            </div>

            {step2Data.role === 'CLIENT' && (
              <>
                <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    <span>{t('labels.clientType')}</span>
                  </div>
                  <div className="p-2 sm:p-3">
                    <select
                      value={step2Data.clientType || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStep2Data({ 
                          ...step2Data, 
                          clientType: value === 'INDIVIDUAL' || value === 'AGENCY' ? value : undefined 
                        });
                      }}
                      className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md"
                    >
                      <option value="">{t('placeholders.selectClientType')}</option>
                      <option value="INDIVIDUAL">{t('clientTypes.particulier')}</option>
                      <option value="AGENCY">{t('clientTypes.entreprise')}</option>
                    </select>
                  </div>
                </div>

                {step2Data.clientType === 'AGENCY' && (
                  <>
                    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                      <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>{t('labels.companyName')}</span>
                      </div>
                      <div className="p-2 sm:p-3">
                        <input
                          type="text"
                          value={step2Data.companyName || ''}
                          onChange={(e) => handleCompanyNameChange(e.target.value)}
                          placeholder={t('placeholders.companyName')}
                          className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none rounded-md transition-all ${
                            errors.companyName 
                              ? 'border-red-500 focus:border-red-500' 
                              : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7]'
                          }`}
                        />
                        {errors.companyName && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                      <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>{t('labels.rccmNumber')}</span>
                      </div>
                      <div className="p-2 sm:p-3">
                        <input
                          type="text"
                          value={step2Data.rccmNumber || ''}
                          onChange={(e) => handleRccmChange(e.target.value)}
                          placeholder={t('placeholders.rccmNumber')}
                          className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none rounded-md transition-all ${
                            errors.rccmNumber 
                              ? 'border-red-500 focus:border-red-500' 
                              : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7]'
                          }`}
                        />
                        {errors.rccmNumber && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-red-500">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors.rccmNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {step2Data.role === 'PROVIDER' && (
              <>
                <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>{t('labels.providerType')}</span>
                  </div>
                  <div className="p-2 sm:p-3">
                    <select
                      value={step2Data.providerType || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStep2Data({ 
                          ...step2Data, 
                          providerType: value === 'SALON' || value === 'FREELANCE' || value === 'SHOP' ? value : undefined 
                        });
                      }}
                      className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md"
                    >
                      <option value="">{t('placeholders.selectProviderType')}</option>
                      <option value="SALON">{t('providerTypes.salon')}</option>
                      <option value="FREELANCE">{t('providerTypes.freelance')}</option>
                      <option value="SHOP">{t('providerTypes.shop')}</option>
                    </select>
                  </div>
                </div>

                <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>{t('labels.bio')}</span>
                  </div>
                  <div className="p-2 sm:p-3">
                    <textarea
                      value={step2Data.bio || ''}
                      onChange={(e) => setStep2Data({ ...step2Data, bio: e.target.value })}
                      rows={4}
                      maxLength={500}
                      placeholder={t('placeholders.bio')}
                      className="w-full resize-none border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md"
                    />
                    <p className="mt-1 text-[10px] sm:text-xs text-zinc-500">
                      {(step2Data.bio || '').length}/500 {t('characters')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-zinc-300 dark:border-zinc-700">
            <button
              type="button"
              onClick={handlePrevious}
              className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('navigation.previous')}
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-zinc-500">
                {t('navigation.step')} 2/3
              </span>
              <button
                type="submit"
                className="bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-xs sm:text-sm px-6 sm:px-10 py-2.5 sm:py-3 transition-colors flex items-center gap-2 rounded-md"
              >
                {t('navigation.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className={`w-full max-w-4xl mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8  text-black dark:text-zinc-300 ${orbitron.className}`}>
          <div className="mb-4 sm:mb-6 text-center">
            <Image
              src={Img3}
              alt="Step 3"
              width={80}
              height={80}
              className="mx-auto mb-2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
            />
            <h2 className="text-lg sm:text-xl font-bold">{t('step3.title')}</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{t('step3.subtitle')}</p>
          </div>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-300">{submitError}</p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 sm:p-4">
                <h3 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3">{t('step3.summary')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{t('labels.name')}:</span>
                      <span className="truncate">{step1Data.name}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{t('labels.email')}:</span>
                      <span className="truncate">{step1Data.email}</span>
                    </p>
                    {step1Data.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{t('labels.phone')}:</span>
                        <span className="truncate">{step1Data.phone}</span>
                      </p>
                    )}
                    {detectedOperator && (
                      <p className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 shrink-0 text-green-600" />
                        <span className="font-semibold">{t('labels.operator')}:</span>
                        <span className="truncate">{detectedOperator}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{t('labels.role')}:</span>
                      <span className="truncate">{step2Data.role === 'CLIENT' ? t('roles.client') : t('roles.provider')}</span>
                    </p>
                    {step2Data.role === 'CLIENT' && step2Data.clientType && (
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{t('labels.clientType')}:</span>
                        <span className="truncate">
                          {step2Data.clientType === 'INDIVIDUAL' ? t('clientTypes.particulier') : t('clientTypes.entreprise')}
                        </span>
                      </p>
                    )}
                    {step2Data.role === 'PROVIDER' && step2Data.providerType && (
                      <p className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{t('labels.providerType')}:</span>
                        <span className="truncate">
                          {step2Data.providerType === 'SALON' ? t('providerTypes.salon') : 
                           step2Data.providerType === 'FREELANCE' ? t('providerTypes.freelance') : 
                           t('providerTypes.shop')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{t('labels.verification')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, verificationMethod: 'email' })}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      step3Data.verificationMethod === 'email'
                        ? 'border-[#432dd7] bg-[#432dd7]/5'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
                    <span className="block text-xs sm:text-sm font-bold">{t('verification.email')}</span>
                    <span className="block text-[10px] sm:text-xs text-zinc-500 mt-1">{t('verification.emailDesc')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, verificationMethod: 'phone' })}
                    disabled={!step1Data.phone}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      step3Data.verificationMethod === 'phone'
                        ? 'border-[#432dd7] bg-[#432dd7]/5'
                        : step1Data.phone
                        ? 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                        : 'border-zinc-300 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
                    <span className="block text-xs sm:text-sm font-bold">{t('verification.phone')}</span>
                    <span className="block text-[10px] sm:text-xs text-zinc-500 mt-1">
                      {step1Data.phone ? t('verification.phoneDesc') : t('verification.phoneUnavailable')}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t('labels.newsletter')}</span>
              </div>
              <div className="p-2 sm:p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step3Data.acceptNewsletter}
                    onChange={(e) => setStep3Data({ ...step3Data, acceptNewsletter: e.target.checked })}
                    className="mt-1 w-4 h-4 border-zinc-300 dark:border-zinc-600 rounded focus:ring-[#432dd7] text-[#432dd7] shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {t('newsletter.accept')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-zinc-300 dark:border-zinc-700">
            <button
              type="button"
              onClick={handlePrevious}
              className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('navigation.previous')}
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-zinc-500">
                {t('navigation.step')} 3/3
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-6 sm:px-10 py-2.5 sm:py-3 transition-colors flex items-center gap-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isSubmitting ? t('navigation.loading') : t('navigation.submit')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterForm; 