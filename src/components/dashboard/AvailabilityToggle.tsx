
"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Coffee, Loader2 } from "lucide-react";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AvailabilityToggleProps {
  currentStatus: Profile['availabilityStatus'];
  onStatusChange: (newStatus: Required<Profile['availabilityStatus']>) => void;
  isLoading?: boolean;
}

export function AvailabilityToggle({ currentStatus, onStatusChange, isLoading }: AvailabilityToggleProps) {
  const isOnline = currentStatus === "online";

  const handleOnlineToggle = (checked: boolean) => {
    if (isLoading) return;
    if (checked) {
      onStatusChange("online");
    } else {
      onStatusChange("offline");
    }
  };

  const getStatusInfo = () => {
    if (isLoading) return { text: "Updating...", color: "text-muted-foreground" };
    if (isOnline) {
      return { text: "Online", color: "text-green-400" };
    }
    return { text: "Offline", color: "text-red-500" };
  }

  const statusInfo = getStatusInfo();

  return (
     <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
           <div className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <Switch
                    checked={isOnline}
                    onCheckedChange={handleOnlineToggle}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                    aria-label={isOnline ? "Go Offline" : "Go Online"}
                    disabled={isLoading}
                />
              </div>
              <Label htmlFor="online-toggle" className={cn("text-lg font-medium", statusInfo.color)}>
                 {statusInfo.text}
              </Label>
           </div>
        </TooltipTrigger>
        <TooltipContent>
            <p>{isOnline ? "You are available for new orders" : "You are offline and won't receive orders"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
