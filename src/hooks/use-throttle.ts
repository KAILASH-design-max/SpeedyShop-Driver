
"use client";

import { useRef, useEffect, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const lastCall = useRef(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any lingering timeout on unmount
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall.current;

      if (timeSinceLastCall >= delay) {
        // If enough time has passed, call the function immediately
        lastCall.current = now;
        callback(...args);
      } else {
        // Otherwise, clear the old timeout and set a new one
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );

  return throttledCallback;
}
