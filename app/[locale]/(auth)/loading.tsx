"use client";
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import React from 'react';

const LoadingComponentPage = () => {
  const t = useTranslations('auth');

  return (
    <div className="w-full h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-y-7">
      <div className="relative w-24 h-30 flex items-center justify-center">
        <svg viewBox="0 0 100 130" className="w-full h-full">
          <rect
            x="10" y="6" width="80" height="118" rx="2"
            fill="none" stroke="#5DADE2" strokeWidth="1.5"
          />
          <circle cx="72" cy="65" r="2" fill="#5DADE2" />
        </svg>
        <span className="ring p1" />
        <span className="ring p2" />
        <span className="ring p3" />
      </div>

      <p className={`text-black dark:text-white text-sm font-medium tracking-wide ${orbitron.className}`}>
        {t('loading')}
      </p>

      <style jsx>{`
        .ring {
          position: absolute;
          width: 10px;
          height: 10px;
          border: 1px solid #A8D8EA;
          border-radius: 50%;
          opacity: 0;
          transform: scale(0.4);
        }
        .p1 { top: 4px;  left: -2px; animation: ripple 3.2s ease-out infinite; animation-delay: 0.3s; }
        .p2 { top: 40px; left: 40px; animation: ripple 3.2s ease-out infinite; animation-delay: 1.1s; }
        .p3 { top: 4px;  left: 82px; animation: ripple 3.2s ease-out infinite; animation-delay: 1.9s; }

        @keyframes ripple {
          0%   { opacity: 0; transform: scale(0.4); }
          15%  { opacity: 0.8; }
          60%  { opacity: 0; transform: scale(3); }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingComponentPage;