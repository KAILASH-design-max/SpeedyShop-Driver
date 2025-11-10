
"use client";

import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { ActiveTimeTracker } from "./ActiveTimeTracker";
import { NotificationBell } from "../layout/NotificationBell";
import type { Profile } from "@/types";

interface DashboardHeaderProps {
  profile: Profile | null;
  availabilityStatus: Profile['availabilityStatus'];
  onStatusChange: (newStatus: Required<Profile['availabilityStatus']>) => void;
  isAvailabilityLoading: boolean;
}

export function DashboardHeader({
  profile,
  availabilityStatus,
  onStatusChange,
  isAvailabilityLoading
}: DashboardHeaderProps) {
  
  if (!profile) {
    return (
        <div className="flex justify-between items-center p-4">
            <div>
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mt-2 animate-pulse"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex items-center gap-4">
        <Link href="/profile">
            <Avatar className="h-14 w-14 border-2 border-primary">
                <AvatarImage src={profile.profilePictureUrl || undefined} alt={profile.name} data-ai-hint="person face" />
                <AvatarFallback>{profile.name?.substring(0, 2).toUpperCase() || 'P'}</AvatarFallback>
            </Avatar>
        </Link>
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-foreground">
            Welcome, {profile.name.split(" ")[0]}!
          </h1>
          <div className="mt-1">
             <AvailabilityToggle 
                currentStatus={availabilityStatus}
                onStatusChange={onStatusChange}
                isLoading={isAvailabilityLoading}
              />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
            <ActiveTimeTracker />
        </div>
        <div className="hidden md:block">
            <NotificationBell />
        </div>
      </div>
    </div>
  );
}
