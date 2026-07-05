"use client";
import { ReactNode } from "react";
import { useEffect } from "react";

interface Props {
    children: ReactNode;
}

export default function CursorEffect({ children }: Props) {
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const particle = document.createElement("div");
            particle.className = "dust-particle";
            particle.style.left = `${e.clientX}px`;
            particle.style.top = `${e.clientY}px`;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return <>{children}</>;
}