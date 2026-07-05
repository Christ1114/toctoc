"use client";
import React from 'react'
import { SunIcon, MoonIcon } from "@phosphor-icons/react";
import { useTheme } from 'next-themes';

const LightNightComponent = () => {
    const { theme, setTheme } = useTheme();

    return (
        <button
            className="relative w-6 h-6 text-black dark:text-white cursor-pointer"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            <SunIcon
                size={25}
                className="absolute inset-0 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all duration-300 cursor-pointer"
            />
            <MoonIcon
                size={25}
                className="absolute inset-0 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all duration-300 cursor-pointer"
            />
        </button>
    );
}

export default LightNightComponent;