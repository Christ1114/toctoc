"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { Mail, User, MessageSquare, Tag, Send } from 'lucide-react';

const categories = ['usageQuestion', 'signupRequest', 'passwordRequest', 'paymentRequest'] as const;

const ContactFormComponent = () => {
  const t = useTranslations('contact');
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]>('usageQuestion');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ selectedCategory, email, name, message });
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
                  className={`px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold border rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#432dd7] text-white border-[#432dd7]'
                      : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md"
            />
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
              className="w-full resize-none border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#432dd7] rounded-md sm:rows-6 md:rows-8"
            />
          </div>
        </div>
      </div>

     
      <div className="flex justify-center mt-4 sm:mt-6 pt-4 border-t border-zinc-300 dark:border-zinc-700">
        <button
          type="submit"
          className="w-full sm:w-auto bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-xs sm:text-sm px-6 sm:px-10 py-2.5 sm:py-3 transition-colors flex items-center justify-center gap-2 rounded-md"
        >
          <Send className="w-4 h-4" />
          {t('submitBtn')}
        </button>
      </div>
    </form>
  );
};

export default ContactFormComponent;