
"use client";

import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import type { Profile } from "@/types";
import { ActiveTimeTracker } from "./ActiveTimeTracker";

interface DashboardHeaderProps {
  currentStatus: Profile['availabilityStatus'];
  onStatusChange: (newStatus: Required<Profile['availabilityStatus']>) => void;
  isLoading?: boolean;
}

export function DashboardHeader({ currentStatus, onStatusChange, isLoading }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-end items-center gap-4 p-4 rounded-lg bg-card border">
        <div className="flex items-center gap-4">
            <ActiveTimeTracker />
             <AvailabilityToggle
                currentStatus={currentStatus}
                onStatusChange={onStatusChange}
                isLoading={isLoading}
            />
        </div>
    </div>
  );
}
