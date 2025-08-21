
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
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-card border">
        <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your status and view active orders.</p>
        </div>
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
