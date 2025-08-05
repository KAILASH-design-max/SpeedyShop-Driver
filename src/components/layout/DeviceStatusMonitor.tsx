
"use client";

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BatteryWarning, WifiOff } from 'lucide-react';

export function DeviceStatusMonitor() {
  const { toast } = useToast();
  const hasShownBatteryWarning = useRef(false);
  const hasShownGpsWarning = useRef(false);

  useEffect(() => {
    // --- Battery Status Check ---
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const handleBatteryChange = () => {
            if (!battery.charging && battery.level < 0.2) { // 20% threshold
              if (!hasShownBatteryWarning.current) {
                toast({
                  variant: "destructive",
                  title: "Low Battery Warning",
                  description: `Your battery is at ${(battery.level * 100).toFixed(0)}%. Please connect to a power source.`,
                  duration: 10000,
                  action: <BatteryWarning className="text-white" />
                });
                hasShownBatteryWarning.current = true;
              }
            } else if (battery.charging || battery.level >= 0.2) {
                // Reset the warning if the condition is no longer met,
                // so it can be shown again if the battery drains later.
                hasShownBatteryWarning.current = false;
            }
          };

          handleBatteryChange(); // Initial check
          battery.addEventListener('levelchange', handleBatteryChange);
          battery.addEventListener('chargingchange', handleBatteryChange);

          // Return a cleanup function
          return () => {
            battery.removeEventListener('levelchange', handleBatteryChange);
            battery.removeEventListener('chargingchange', handleBatteryChange);
          };
        } catch (err) {
            console.warn("Could not access Battery Status API.", err);
        }
      }
    };

    // --- GPS Status Check ---
    const checkGps = async () => {
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

          const handleGpsChange = () => {
            if (permissionStatus.state === 'denied') {
              if (!hasShownGpsWarning.current) {
                toast({
                  variant: "destructive",
                  title: "GPS Access Denied",
                  description: "Location tracking is required for deliveries. Please enable location permissions in your browser settings.",
                  duration: 10000,
                  action: <WifiOff className="text-white" />
                });
                hasShownGpsWarning.current = true;
              }
            } else if (permissionStatus.state === 'granted') {
                hasShownGpsWarning.current = false;
            }
          };

          handleGpsChange(); // Initial check
          permissionStatus.onchange = handleGpsChange;

          // Return a cleanup function
          return () => {
            permissionStatus.onchange = null;
          };

        } catch (err) {
            console.warn("Could not access Geolocation Permissions API.", err);
        }
      }
    };
    
    // Set up separate cleanup functions for each check
    let batteryCleanup: (() => void) | undefined;
    let gpsCleanup: (() => void) | undefined;
    
    const runChecks = async () => {
        batteryCleanup = await checkBattery();
        gpsCleanup = await checkGps();
    }
    
    runChecks();

    return () => {
        if (batteryCleanup) batteryCleanup();
        if (gpsCleanup) gpsCleanup();
    };
  }, [toast]);

  return null; // This component does not render any UI itself
}
