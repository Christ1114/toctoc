"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { Mail, User, MessageSquare, Tag, Send, Loader, CheckCircle, XCircle } from 'lucide-react';

const categories = ['usageQuestion', 'signupRequest', 'passwordRequest', 'paymentRequest'] as const;

const ContactFormComponent = () => {
  const t = useTranslations('contact');
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]>('usageQuestion');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);


  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
  
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
      setEmailError(t('invalidEmail') || 'Email invalide');
    } else {
      setEmailError('');
    }
  };


  const validateEmailWithAPI = async (emailToValidate: string): Promise<boolean> => {
    setIsValidatingEmail(true);
    setEmailError('');

    try {
      console.log('🔍 Validation email avec API:', emailToValidate);
      
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToValidate.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de validation');
      }

      console.log('📋 Résultat validation:', data);

      if (!data.valid) {
        setEmailError(data.message || t('invalidEmail') || 'Email invalide');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur validation email:', error);
      setEmailError(error instanceof Error ? error.message : 'Erreur de validation');
      return false;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    
    if (!email.trim() || !name.trim() || !message.trim()) {
      setStatus('error');
      setErrorMessage(t('checkFields') || 'Veuillez remplir tous les champs');
      return;
    }

    try {
      
      const emailValid = await validateEmailWithAPI(email);
      
      if (!emailValid) {
        setStatus('error');
        setErrorMessage(t('checkEmail') || 'Veuillez vérifier votre email');
        return;
      }

     
      const formData = {
        category: selectedCategory,
        email: email.trim(),
        name: name.trim(),
        message: message.trim(),
        categoryLabel: t(`categories.${selectedCategory}`),
      };

      console.log('📤 Envoi des données:', formData);


      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      console.log('✅ Message envoyé avec succès:', data);
      setStatus('success');
      
     
      setEmail('');
      setName('');
      setMessage('');
      setSelectedCategory('usageQuestion');
      setEmailError('');

      setTimeout(() => setStatus('idle'), 5000);

    } catch (error) {
      console.error('❌ Erreur:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-4xl mx-auto pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6 md:px-8 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 ${orbitron.className}`}
    >
      <div className="space-y-3 sm:space-y-4">
      
     
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
          <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
            <Tag className="w-4 h-4 shrink-0" />
            <span>{t('category')}</span>
          </div>
          <div className="p-2 sm:p-3">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
  {categories.map((cat) => (
    <button
      key={cat}
      type="button"
      onClick={() => setSelectedCategory(cat)}
      disabled={status === 'loading' || isValidatingEmail}
      className={`px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold border rounded-md transition-colors ${
        selectedCategory === cat
          ? 'bg-[#432dd7] text-white border-[#432dd7]'
          : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      } ${
        status === 'loading' || isValidatingEmail
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer'
      }`}
    >
      {t(`categories.${cat}`)}
    </button>
  ))}
</div>
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {t(`categoryDescriptions.${selectedCategory}`)}
            </p>
          </div>
        </div>

  
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
          <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0" />
            <span>{t('contact')}</span>
          </div>
          <div className="p-2 sm:p-3">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t('emailPlaceholder')}
                required
                disabled={status === 'loading' || isValidatingEmail}
                className={`w-full border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none rounded-md transition-colors ${
                  emailError 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-zinc-300 dark:border-zinc-600 focus:border-[#432dd7]'
                }`}
              />
              {isValidatingEmail && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="w-4 h-4 animate-spin text-[#432dd7]" />
                </div>
              )}
            </div>
            {emailError && (
              <p className="text-[10px] sm:text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {emailError}
              </p>
            )}
            {!emailError && email && !isValidatingEmail && (
              <p className="text-[10px] sm:text-xs text-green-500 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('emailValid') || 'Email valide'}
              </p>
            )}
          </div>
        </div>

  
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
          <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" />
            <span>{t('name')}</span>
          </div>
          <div className="p-2 sm:p-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
              disabled={status === 'loading' || isValidatingEmail}
              className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md"
            />
          </div>
        </div>

      
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
          <div className="bg-zinc-100 dark:bg-zinc-800 font-bold text-xs sm:text-sm p-2 sm:p-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>{t('message')}</span>
          </div>
          <div className="p-2 sm:p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              disabled={status === 'loading' || isValidatingEmail}
              placeholder={t('messagePlaceholder')}
              className="w-full resize-none border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md sm:rows-6 md:rows-8"
            />
          </div>
        </div>
      </div>

   
      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm">{t('successMessage')}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <XCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm">{errorMessage || t('errorMessage')}</span>
        </div>
      )}

     
      <div className="flex justify-center mt-4 sm:mt-6 pt-4 border-t border-zinc-300 dark:border-zinc-700">
        <button
          type="submit"
          disabled={status === 'loading' || isValidatingEmail}
          className="w-full sm:w-auto bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-xs sm:text-sm px-6 sm:px-10 py-2.5 sm:py-3 transition-colors flex items-center justify-center gap-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' || isValidatingEmail ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {isValidatingEmail ? t('validatingEmail') : t('sending')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('submitBtn')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactFormComponent;