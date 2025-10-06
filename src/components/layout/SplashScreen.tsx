
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <path d="M5 18H3c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h10v11" />
        <path d="M14 9h4l4 4v4h-8v-11" />
        <circle cx="7.5" cy="18.5" r="2.5" />
        <circle cx="17.5" cy="18.5" r="2.5" />
    </svg>
);

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('splash-screen-shown')) {
      setIsVisible(false);
      return;
    }

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000); // Start fading after 2 seconds

    const visibilityTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('splash-screen-shown', 'true');
    }, 2500); // Hide completely after fade out (500ms duration)

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(visibilityTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100"
    )}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <TruckIcon className="h-24 w-24 text-primary" data-ai-hint="delivery truck" />
            <h1 className="text-4xl font-bold text-primary">SpeedyDelivery</h1>
        </div>
    </div>
  );
}
