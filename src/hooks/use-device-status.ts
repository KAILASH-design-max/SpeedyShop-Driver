
"use client";

import { useState, useEffect } from 'react';

interface BatteryStatus {
  charging: boolean;
  level: number;
}

type GpsStatus = 'granted' | 'prompt' | 'denied';

export function useDeviceStatus() {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus | null>(null);

  useEffect(() => {
    // --- Battery Status Check ---
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          const updateBatteryStatus = () => {
            setBatteryStatus({
              charging: battery.charging,
              level: battery.level,
            });
          };

          updateBatteryStatus();
          battery.addEventListener('levelchange', updateBatteryStatus);
          battery.addEventListener('chargingchange', updateBatteryStatus);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryStatus);
            battery.removeEventListener('chargingchange', updateBatteryStatus);
          };
        } catch (err) {
            console.warn("Could not access Battery Status API.", err);
        }
      }
    };

    // --- GPS Status Check ---
    const monitorGps = async () => {
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          
          const updateGpsStatus = () => {
            setGpsStatus(permissionStatus.state);
          };

          updateGpsStatus();
          permissionStatus.onchange = updateGpsStatus;

          return () => {
            permissionStatus.onchange = null;
          };
        } catch (err) {
            console.warn("Could not access Geolocation Permissions API.", err);
        }
      }
    };
    
    let batteryCleanup: (() => void) | undefined;
    let gpsCleanup: (() => void) | undefined;
    
    const runMonitors = async () => {
        batteryCleanup = await monitorBattery();
        gpsCleanup = await monitorGps();
    }
    
    runMonitors();

    return () => {
        if (batteryCleanup) batteryCleanup();
        if (gpsCleanup) gpsCleanup();
    };
  }, []);

  return { batteryStatus, gpsStatus };
}
