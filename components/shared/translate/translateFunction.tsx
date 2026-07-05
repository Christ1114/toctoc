"use client";
import { useRouter, usePathname } from '@/navigation';
import { useParams } from 'next/navigation';
import { useTransition, useState } from 'react';
import clsx from 'clsx';

const LANGUAGES = [
    { value: 'fr', label: '🇨🇮Fr' },
    { value: 'en', label: '🇬🇧 En' },
    { value: 'ar', label: '🇸🇦 Ar' },
    { value: 'zh', label: '🇨🇳 Zh' },
];

type Props = {
    defaultValue: string;
    label: string;
}

const TranslateFunction = ({ defaultValue, label }: Props) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const params = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(defaultValue.toUpperCase());

    function onSelectLanguage(value: string) {
        setSelected(value.toUpperCase());
        setIsOpen(false);
        startTransition(() => {
            router.replace(
                // @ts-ignore
                { pathname, params },
                { locale: value }
            );
        });
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'flex items-center gap-1 font-bold text-sm text-black dark:text-white cursor-pointer',
                    isPending && 'opacity-50 pointer-events-none'
                )}
            >
                {selected}
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 translate-x-10 mt-2 w-28 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-zinc-600 rounded-xl shadow-lg py-1.5 z-60">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.value}
                            onClick={() => onSelectLanguage(lang.value)}
                            className={clsx(
                                'w-full text-left px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                                selected === lang.value.toUpperCase()
                                    ? 'text-[#e8401c] font-bold'
                                    : 'text-black dark:text-zinc-100 hover:bg-gray-300 dark:hover:bg-neutral-700'
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TranslateFunction;