
"use client";

import { useState, useEffect } from 'react';

type NetworkStatus = 'online' | 'offline' | 'unstable';

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online');

  useEffect(() => {
    // Set initial status from navigator.onLine
    setStatus(navigator.onLine ? 'online' : 'offline');

    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // More robust check for "unstable" connections
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }
      
      // A request to a no-cors endpoint is a good way to check connectivity
      // without CORS issues. Google's is reliable and fast.
      try {
        const response = await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
        
        // Even with no-cors, we can't read the response body, but a successful
        // fetch (even if opaque) suggests we are online.
        if (status !== 'online') {
            setStatus('online');
        }

      } catch (error) {
        // Fetch failed, so connection is likely unstable or down
        setStatus('unstable');
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [status]); // Rerun effect if status changes from other sources

  return status;
}
