"use client"
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
};

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
        <div className="w-full pt-8 sm:pt-10 lg:pt-15 xl:pt-20 flex items-start justify-center relative z-0 px-2 sm:px-3 lg:px-0">
            <div
                className="w-full max-w-4xl xl:max-w-5xl bg-[#432dd7] overflow-hidden mx-auto rounded-xl sm:rounded-2xl relative"
            >

                <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_auto_1fr] items-center
                                w-full
                                px-3 sm:px-5 lg:px-8 xl:px-10
                                pt-3 sm:pt-4 xl:pt-6
                                pb-3 sm:pb-4 xl:pb-6
                                gap-2 sm:gap-4 lg:gap-6 xl:gap-8
                                relative z-10
                                min-h-19 sm:min-h-23 lg:min-h-27 xl:min-h-32">


                    <div className="flex items-center justify-center sm:justify-start self-center shrink-0">
                        <span className={`text-[10px] sm:text-xs xl:text-sm font-bold text-[#432dd7] bg-white
                                         px-2 sm:px-2.5 xl:px-3 py-0.5 xl:py-1 rounded-full w-fit whitespace-nowrap
                                         ${orbitron.className}`}>
                            {t("btn_1")}
                        </span>
                    </div>

                    <div className="hidden sm:flex relative overflow-hidden items-center justify-center shrink-0">
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
                                    width={80}
                                    height={80}
                                    sizes="(min-width: 1280px) 120px, (min-width: 1024px) 100px, 80px"
                                    className="opacity-95 object-contain
                                               w-15 h-15 sm:w-20 sm:h-20 lg:w-25 lg:h-25 xl:w-30 xl:h-30"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>


                    <div className="flex flex-col gap-0.5 sm:gap-1 xl:gap-1.5 min-w-0 justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`text-${current}`}
                                variants={textVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="flex flex-col gap-0.5 sm:gap-1 xl:gap-1.5"
                            >
                                <h2 className={`font-bold text-white leading-tight
                                                text-xs sm:text-base lg:text-xl xl:text-2xl
                                                line-clamp-2
                                                ${orbitron.className}`}>
                                    {item.title}
                                </h2>
                                <p className={`text-white/80 leading-relaxed
                                               text-[11px] sm:text-xs lg:text-sm xl:text-base
                                               line-clamp-2 sm:line-clamp-3
                                               ${orbitron.className}`}>
                                    {item.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex sm:hidden items-center justify-center pb-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`image-mobile-${current}`}
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
                                width={80}
                                height={80}
                                sizes="70px"
                                className="opacity-95 object-contain w-17.5 h-17.5"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="absolute bottom-2 xl:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5 xl:gap-2 z-20">
                    {slider.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`rounded-full transition-all duration-300 cursor-pointer ${
                                i === current
                                    ? 'bg-white w-3 sm:w-4 xl:w-5 h-1 sm:h-1.5 xl:h-2'
                                    : 'bg-white/40 w-1 sm:w-1.5 xl:w-2 h-1 sm:h-1.5 xl:h-2'
                            }`}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FirstModuleHome;