
"use client";

import { useNetworkStatus } from '@/hooks/use-network-status';
import { cn } from '@/lib/utils';
import { WifiOff, Wifi } from 'lucide-react';

export function ConnectionStatusBanner() {
  const status = useNetworkStatus();

  if (status === 'online') {
    return null;
  }

  const isOffline = status === 'offline';
  const bannerClasses = cn(
    'fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-center p-3 text-sm font-medium text-white transition-transform duration-300',
    isOffline ? 'bg-destructive' : 'bg-yellow-600',
    status !== 'online' ? 'translate-y-0' : 'translate-y-full'
  );

  return (
    <div className={bannerClasses}>
      {isOffline ? (
        <WifiOff className="mr-2 h-5 w-5" />
      ) : (
        <Wifi className="mr-2 h-5 w-5" />
      )}
      {isOffline
        ? "You're offline. Trying to reconnect..."
        : 'Your connection seems unstable. Some features may not work.'}
    </div>
  );
}
