
"use client";

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BatteryWarning, WifiOff } from 'lucide-react';
import { useDeviceStatus } from '@/hooks/use-device-status';

export function DeviceStatusMonitor() {
  const { toast } = useToast();
  const { batteryStatus, gpsStatus } = useDeviceStatus();
  const hasShownBatteryWarning = useRef(false);
  const hasShownGpsWarning = useRef(false);

  useEffect(() => {
    if (batteryStatus) {
      if (!batteryStatus.charging && batteryStatus.level < 0.15) {
        if (!hasShownBatteryWarning.current) {
          toast({
            variant: "destructive",
            title: "Low Battery Warning",
            description: `Your battery is at ${(batteryStatus.level * 100).toFixed(0)}%. Please connect to a power source.`,
            duration: 10000,
            action: <BatteryWarning className="text-white" />
          });
          hasShownBatteryWarning.current = true;
        }
      } else if (batteryStatus.charging || batteryStatus.level >= 0.15) {
        hasShownBatteryWarning.current = false;
      }
    }
  }, [batteryStatus, toast]);

  useEffect(() => {
    if (gpsStatus) {
      if (gpsStatus === 'denied') {
        if (!hasShownGpsWarning.current) {
          toast({
            variant: "destructive",
            title: "GPS Access Denied",
            description: "Location tracking is required for deliveries. Please enable location permissions.",
            duration: 10000,
            action: <WifiOff className="text-white" />
          });
          hasShownGpsWarning.current = true;
        }
      } else {
        hasShownGpsWarning.current = false;
      }
    }
  }, [gpsStatus, toast]);

  return null; // This component does not render any UI itself
}
