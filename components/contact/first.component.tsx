"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

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
      className={`w-full max-w-250 pt-15 pb-15 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 ${orbitron.className}`}
    >
      <div className="grid grid-cols-[140px_1fr] border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 font-bold text-sm p-4">
          {t('category')}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-500 text-white border-zinc-500'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(`categoryDescriptions.${selectedCategory}`)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[140px_1fr] border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 font-bold text-sm p-4">
          {t('contact')}
        </div>
        <div className="p-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-[140px_1fr] border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 font-bold text-sm p-4">
          {t('name')}
        </div>
        <div className="p-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-[140px_1fr] border-b border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 font-bold text-sm p-4">
          {t('message')}
        </div>
        <div className="p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="w-full resize-none border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="flex justify-center p-6">
        <button
          type="submit"
          className="bg-[#432dd7] hover:bg-[#554c8f] text-white font-bold text-sm px-10 py-3 transition-colors"
        >
          {t('submitBtn')}
        </button>
      </div>
    </form>
  );
};

export default ContactFormComponent;