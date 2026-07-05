"use client";
import { orbitron } from '@/fonts/font';
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
type SliderItem = {
    index: number;
    title: string;
    description: string;
    image: string;
}
const FirstModuleHome = () => {
    const t = useTranslations("firstModuleHome");
    const [current, setCurrent] = useState(0);

    const slider: SliderItem[] = [
        {
            index: 1,
            title: t("card_title1"),
            description: t("card_description1"),
            image: "/assets/pictures/card1.png",
        },
        {
            index: 2,
            title: t("card_title2"),
            description: t("card_description2"),
            image: "/assets/pictures/card2.png",
        },
        {
            index: 3,
            title: t("card_title3"),
            description: t("card_description3"),
            image: "/assets/pictures/card3.png",
        },
        {
            index: 4,
            title: t("card_title4"),
            description: t("card_description4"),
            image: "/assets/pictures/card4.png",
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % slider.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slider.length]);

    const goTo = (index: number) => setCurrent(index);

    const item = slider[current];
    const imageVariants = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    };

    const textVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="w-full pt-15 flex items-start justify-center relative z-0 ">
<div 
    className=" w-full max-w-4xl bg-[#432dd7] overflow-hidden mx-auto flex justify-between"
    style={{ minHeight: '150px', height: 'auto' }}
>
                <div className="flex items-center justify-between h-full w-full px-8 py-3 gap-6 relative z-10">
                    <div className="flex flex-col items-start justify-start self-start pt-1 shrink-0">
                        <span className={`text-[10px] font-bold text-[#432dd7] bg-white px-2.5 py-0.5 rounded-full w-fit whitespace-nowrap ${orbitron.className}`}>
                          {t("btn_1")}
                        </span>
                    </div>
                    <div className="relative overflow-hidden flex items-center justify-center shrink-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`image-${current}`}
                                variants={imageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.4, delay: 0 }}
                                className="flex items-center justify-center"
                            >
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={200}
                                    height={200}
                                    className="opacity-95 object-cover"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`text-${current}`}
                                variants={textVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="flex flex-col gap-1"
                            >
                                <h2 className={`text-xl font-bold text-white leading-tight ${orbitron.className}`}>
                                    {item.title}
                                </h2>
                                <p className={`text-white/80 text-sm  leading-relaxed max-w-sm ${orbitron.className}`}>
                                    {item.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {slider.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`rounded-full transition-all duration-300 ${
                                i === current
                                    ? 'bg-white w-4 h-1.5'
                                    : 'bg-white/40 w-1.5 h-1.5'
                            }`}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
}

export default FirstModuleHome;