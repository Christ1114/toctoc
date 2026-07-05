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

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-white font-sans select-none ${orbitron.className}`}>
      <AnimatePresence mode="wait">

        {timeline === 'bubbles' && (
          <motion.div
            key="bubbles-stage"
            className="absolute inset-0"
            style={{ backgroundColor: '#432dd7' }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            {BUBBLES_DATA.map((bubble, index) => (
              <motion.div
                key={index}
                className="absolute bg-white text-[#432dd7] text-sm md:text-lg font-bold px-5 py-2.5 rounded-2xl shadow-md pointer-events-none whitespace-nowrap"
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
              className="absolute bottom-[23%] right-[5%] bg-white border-2 border-black px-8 py-3 rounded-xl shadow-lg flex items-center gap-2"
              initial={{ scale: 0, x: 50 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="w-5 h-5 bg-[#432dd7] rounded-full animate-pulse" />
              <span className="font-bold text-black text-sm">{t("slogan.aiBadge")}</span>
            </motion.div>
          </motion.div>
        )}

        {timeline === 'slogan' && (
          <motion.div
            key="slogan-stage"
            className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p 
              className="text-gray-500 font-medium tracking-widest text-xs md:text-sm uppercase mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("slogan.subtitle")}
            </motion.p>
            <motion.h1 
              className="text-2xl md:text-5xl font-black tracking-tight max-w-3xl leading-none"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              {t("slogan.title")} <br className="hidden md:inline"/>
              {t("slogan.titleBreak")} <span className="text-[#5b5a66]">{t("slogan.titleHighlight")}</span>
            </motion.h1>
          </motion.div>
        )}

        {timeline === 'brand' && (
          <motion.div
            key="brand-stage"
            className="absolute inset-0 bg-white flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="text-5xl md:text-7xl font-black text-[#432dd7] tracking-tighter"
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
            className="absolute inset-0 bg-[#f8faff] flex items-center justify-center overflow-hidden"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Grille de géolocalisation */}
            <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#432dd7_2px,transparent_2px),linear-gradient(to_bottom,#432dd7_2px,transparent_2px)] bg-size:80px_80px" />
            
            {/* Lignes radiales de portée géographique */}
            <div className="absolute top-1/4 left-1/3 w-64 h-24 border-2 border-[#432dd7] opacity-10 rounded-full pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-96 h-40 border border-[#432dd7] opacity-5 rounded-full pointer-events-none" />

            {/* Onde radar principale */}
            <div className="absolute bottom-[10%] right-[15%] md:bottom-[15%] md:right-[22%] w-48 h-48 bg-[#432dd7] opacity-5 rounded-full animate-ping pointer-events-none" />

            {/* Satellite en orbite */}
            <motion.div 
              className="absolute top-12 right-12 md:top-20 md:right-24 z-0 text-[#432dd7] opacity-30"
              initial={{ x: 100, y: -50, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 0.35 }}
              transition={{ delay: 0.5, duration: 1.2, type: 'spring' }}
            >
              <motion.svg 
                animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                width="80" 
                height="80" 
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

            {/* Pins de géolocalisation */}
            <motion.div 
              className="absolute top-1/3 right-1/3 bg-[#432dd7] w-3 h-3 rounded-full"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}
            >
              <div className="absolute -inset-2 border border-[#432dd7] rounded-full animate-ping opacity-70" />
            </motion.div>

            <motion.div 
              className="absolute bottom-1/3 left-1/4 bg-[#432dd7] w-2.5 h-2.5 rounded-full opacity-60"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.3 }}
            >
              <div className="absolute -inset-3 border border-[#432dd7] rounded-full animate-ping opacity-40" />
            </motion.div>

            {/* Texte descriptif */}
            <div className="z-10 text-center md:text-left max-w-xl px-6 absolute top-24 md:top-auto md:left-24">
              <motion.h2 
                className="text-xs font-bold text-[#432dd7] tracking-widest uppercase mb-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t("map.badge")}
              </motion.h2>
              <motion.p 
                className="text-2xl md:text-4xl font-extrabold text-black leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {t("map.description")}
              </motion.p>
            </div>

            {/* Avatar */}
            <motion.div 
              className="absolute bottom-16 right-16 md:bottom-24 md:right-32 flex flex-col items-center"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 100 }}
            >
              <div className="w-8 h-8 bg-[#432dd7] opacity-20 rounded-full absolute bottom-0 blur-sm animate-pulse" />
            
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative z-20 w-48 h-48 md:w-64 md:h-64"
              >
                <Image 
                  src={Img1} 
                  alt={t("map.alt.avatar")}
                  fill
                  sizes="(max-w-768px) 192px, 256px"
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