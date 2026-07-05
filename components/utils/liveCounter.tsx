'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveCounterProps {
  totalAnnouncements: number;
  newToday: number;
  averageInterval: number; // en minutes entre deux annonces
}

export default function LiveCounter({ totalAnnouncements, newToday, averageInterval }: LiveCounterProps) {
  const [displayCount, setDisplayCount] = useState(totalAnnouncements);
  const [isIncreasing, setIsIncreasing] = useState(false);

  // Animation du compteur principal
  useEffect(() => {
    setDisplayCount(totalAnnouncements);
  }, [totalAnnouncements]);

  // Simulation d'arrivée d'une nouvelle annonce
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // simulation réaliste
        setDisplayCount(prev => prev + 1);
        setIsIncreasing(true);
        setTimeout(() => setIsIncreasing(false), 800);
      }
    }, averageInterval * 60 * 1000); // convert minutes to ms

    return () => clearInterval(interval);
  }, [averageInterval]);

  return (
    <div className="bg-linear-to-br from-emerald-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-8 text-center">
      <div className="text-emerald-400 text-sm uppercase tracking-widest mb-2">
        Annonces de personnel de maison en Côte d'Ivoire
      </div>

      <div className="flex items-baseline justify-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl md:text-8xl font-bold text-white tabular-nums"
          >
            {displayCount.toLocaleString('fr-FR')}
          </motion.span>
        </AnimatePresence>
        <span className="text-3xl text-emerald-400">annonces</span>
      </div>

      <div className="mt-4 text-emerald-300">
        {newToday} nouvelles aujourd’hui • ~1 toutes les {Math.round(averageInterval)} minutes
      </div>

      {isIncreasing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald-400 text-sm mt-2"
        >
          +1 nouvelle annonce en direct
        </motion.div>
      )}
    </div>
  );
}