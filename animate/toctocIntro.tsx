'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { orbitron } from '@/fonts/font';
import { useTranslations } from 'next-intl';
import Img1 from "@/public/assets/pictures/masquote1.png";

const BUBBLES_DATA = [
  { text: "Szia", top: "20%", left: "10%", delay: 0.1 },
  { text: "HELLO", top: "18%", left: "25%", delay: 0.3 },
  { text: "oi", top: "22%", left: "42%", delay: 0.2 },
  { text: "こんにちは", top: "15%", left: "55%", delay: 0.5 },
  { text: "salom", top: "20%", left: "75%", delay: 0.4 },
  { text: "สวัสดี", top: "18%", left: "88%", delay: 0.7 },
  { text: "zdravo", top: "35%", left: "85%", delay: 0.6 },
  { text: "olá", top: "38%", left: "93%", delay: 0.8 },
  { text: "zdra...", top: "45%", left: "88%", delay: 0.9 },
  { text: "Salut", top: "48%", left: "78%", delay: 0.4 },
  { text: "नमस्ते", top: "45%", left: "62%", delay: 0.6 },
  { text: "Hej", top: "46%", left: "48%", delay: 0.1 },
  { text: "안녕하세요!", top: "44%", left: "28%", delay: 0.5 },
  { text: "Hola", top: "46%", left: "15%", delay: 0.3 },
  { text: "драсти", top: "48%", left: "2%", delay: 0.7 },
  { text: "Mbote", top: "62%", left: "5%", delay: 1.0 },
  { text: "Γεια", top: "72%", left: "8%", delay: 0.8 },
  { text: "Ahoj", top: "70%", left: "22%", delay: 0.6 },
  { text: "MERHABA", top: "72%", left: "38%", delay: 0.9 },
  { text: "你好", top: "71%", left: "58%", delay: 0.4 },
  { text: "CIAO", top: "72%", left: "88%", delay: 0.7 },
  { text: "расти", top: "35%", left: "1%", delay: 0.9 },
  { text: "Салом", top: "12%", left: "2%", delay: 1.2 }
];

export default function IntroTocToc() {
  const t = useTranslations("intro");
  const [timeline, setTimeline] = useState('bubbles');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const toSlogan = setTimeout(() => setTimeline('slogan'), 5000);
    const toBrand = setTimeout(() => setTimeline('brand'), 9000);
    const toMap = setTimeout(() => setTimeline('map'), 12000);
    
    return () => {
      clearTimeout(toSlogan);
      clearTimeout(toBrand);
      clearTimeout(toMap);
    };
  }, []);

  const displayBubbles = isMobile 
    ? BUBBLES_DATA.filter((_, i) => i % 2 === 0)
    : BUBBLES_DATA;

  return (
    <div className={`relative w-full h-[420px] sm:h-[480px] md:h-screen overflow-hidden bg-white dark:bg-stone-950 font-sans select-none ${orbitron.className}`}>
      <AnimatePresence mode="wait">

        
        {timeline === 'bubbles' && (
          <motion.div
            key="bubbles-stage"
            className="absolute inset-0"
            style={{ backgroundColor: '#432dd7' }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            {displayBubbles.map((bubble, index) => (
              <motion.div
                key={index}
                className="absolute bg-white text-[#432dd7] 
                           text-[9px] sm:text-sm md:text-base lg:text-lg xl:text-xl
                           font-bold 
                           px-2 py-1 sm:px-4 sm:py-2 md:px-5 md:py-2.5 xl:px-6 xl:py-3
                           rounded-lg sm:rounded-2xl 
                           shadow-md pointer-events-none whitespace-nowrap"
                style={{ top: bubble.top, left: bubble.left }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: bubble.delay, 
                  type: 'spring', 
                  stiffness: 150, 
                  damping: 12 
                }}
              >
                {bubble.text}
              </motion.div>
            ))}

          
            <motion.div 
              className="absolute bottom-[15%] sm:bottom-[20%] md:bottom-[23%] 
                         right-[2%] sm:right-[4%] md:right-[5%] 
                         bg-white border-2 border-black 
                         px-3 py-1.5 sm:px-6 sm:py-2.5 md:px-8 md:py-3 xl:px-10 xl:py-3.5
                         rounded-lg sm:rounded-xl 
                         shadow-lg flex items-center gap-1 sm:gap-2"
              initial={{ scale: 0, x: 50 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 bg-[#432dd7] rounded-full animate-pulse" />
              <span className="font-bold text-black text-[9px] sm:text-xs md:text-sm xl:text-base">
                {t("slogan.aiBadge")}
              </span>
            </motion.div>
          </motion.div>
        )}

        
        {timeline === 'slogan' && (
          <motion.div
            key="slogan-stage"
            className="absolute inset-0 bg-white dark:bg-stone-950 flex flex-col items-center justify-center text-center px-4 sm:px-6 xl:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p 
              className="text-gray-500 dark:text-stone-400 font-medium tracking-widest 
                         text-[9px] sm:text-xs md:text-sm xl:text-base
                         uppercase mb-1 sm:mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("slogan.subtitle")}
            </motion.p>
            <motion.h1 
              className="text-base sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl
                         font-black tracking-tight max-w-[95%] sm:max-w-3xl xl:max-w-4xl
                         leading-tight sm:leading-none
                         text-black dark:text-white"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              {t("slogan.title")} <br className="hidden sm:inline"/>
              {t("slogan.titleBreak")}{' '}
              <span className="text-[#5b5a66] dark:text-stone-400">{t("slogan.titleHighlight")}</span>
            </motion.h1>
          </motion.div>
        )}

       
        {timeline === 'brand' && (
          <motion.div
            key="brand-stage"
            className="absolute inset-0 bg-white dark:bg-stone-950 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl
                         font-black text-[#432dd7] tracking-tighter
                         px-4 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              {t("brand.name")}
            </motion.div>
          </motion.div>
        )}
        {timeline === 'map' && (
          <motion.div
            key="map-stage"
            className="absolute inset-0 bg-[#f8faff] dark:bg-stone-950 flex items-center justify-center overflow-hidden"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 opacity-[0.06] 
                            bg-[linear-gradient(to_right,#432dd7_2px,transparent_2px),linear-gradient(to_bottom,#432dd7_2px,transparent_2px)] 
                            bg-[length:30px_30px] sm:bg-[length:40px_40px] md:bg-[length:60px_60px] xl:bg-[length:80px_80px]" />
            
            <div className="hidden sm:block absolute top-1/4 left-1/3 w-48 sm:w-64 xl:w-72 h-20 sm:h-24 xl:h-28 border-2 border-[#432dd7] opacity-10 rounded-full pointer-events-none" />
            <div className="hidden sm:block absolute bottom-1/3 right-1/4 w-72 sm:w-96 xl:w-100 h-32 sm:h-40 xl:h-44 border border-[#432dd7] opacity-5 rounded-full pointer-events-none" />
            <div className="absolute bottom-[8%] right-[10%] sm:bottom-[12%] sm:right-[18%] md:bottom-[15%] md:right-[22%] 
                            w-20 h-20 sm:w-36 sm:h-36 md:w-48 md:h-48 xl:w-56 xl:h-56
                            bg-[#432dd7] opacity-5 rounded-full animate-ping pointer-events-none" />

            <motion.div 
              className="absolute top-4 right-2 sm:top-10 sm:right-8 md:top-20 md:right-24 z-0 text-[#432dd7] opacity-20 sm:opacity-30"
              initial={{ x: 100, y: -50, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 0.35 }}
              transition={{ delay: 0.5, duration: 1.2, type: 'spring' }}
            >
              <motion.svg 
                animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                width={isMobile ? 40 : 80} 
                height={isMobile ? 40 : 80} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path d="M12 3L20 7.5L12 12L4 7.5L12 3Z" />
                <path d="M4 12.5L12 17L20 12.5" />
                <path d="M12 17V22" />
                <path d="M12 12V17" />
                <circle cx="12" cy="7.5" r="1" fill="currentColor"/>
              </motion.svg>
            </motion.div>

            {/* Pins */}
            <motion.div 
              className="hidden sm:block absolute top-1/3 right-1/3 bg-[#432dd7] w-2 sm:w-3 h-2 sm:h-3 rounded-full"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}
            >
              <div className="absolute -inset-2 border border-[#432dd7] rounded-full animate-ping opacity-70" />
            </motion.div>

            <motion.div 
              className="hidden sm:block absolute bottom-1/3 left-1/4 bg-[#432dd7] w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full opacity-60"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.3 }}
            >
              <div className="absolute -inset-3 border border-[#432dd7] rounded-full animate-ping opacity-40" />
            </motion.div>

            {/* Texte */}
            <div className="z-10 text-center md:text-left 
                            max-w-[92%] sm:max-w-xl xl:max-w-2xl
                            px-3 sm:px-6 xl:px-8
                            absolute top-12 sm:top-20 md:top-auto md:left-16 lg:left-24
                            left-1/2 -translate-x-1/2 md:translate-x-0 md:left-24">
              <motion.h2 
                className="text-[9px] sm:text-xs xl:text-sm font-bold text-[#432dd7] tracking-widest uppercase mb-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t("map.badge")}
              </motion.h2>
              <motion.p 
                className="text-sm sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-black dark:text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {t("map.description")}
              </motion.p>
            </div>

            {/* Avatar */}
            <motion.div 
              className="absolute bottom-6 right-2 sm:bottom-12 sm:right-8 md:bottom-24 md:right-32 
                         flex flex-col items-center"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 100 }}
            >
              <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 xl:w-10 xl:h-10 bg-[#432dd7] opacity-20 rounded-full absolute bottom-0 blur-sm animate-pulse" />
            
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative z-20 
                           w-20 h-20 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-72 xl:h-72"
              >
                <Image 
                  src={Img1} 
                  alt={t("map.alt.avatar")}
                  fill
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 160px, (max-width: 1024px) 192px, (max-width: 1280px) 256px, 288px"
                  className="object-contain"
                  priority
                />
              </motion.div>
            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}