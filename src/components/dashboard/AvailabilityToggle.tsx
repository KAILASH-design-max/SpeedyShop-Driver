
"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Coffee, ZapOff, Loader2 } from "lucide-react";
import type { Profile } from "@/types";

interface AvailabilityToggleProps {
  currentStatus: Profile['availabilityStatus'];
  onStatusChange: (newStatus: Required<Profile['availabilityStatus']>) => void;
  isLoading?: boolean;
}

export function AvailabilityToggle({ currentStatus, onStatusChange, isLoading }: AvailabilityToggleProps) {
  const isOnline = currentStatus === "online" || currentStatus === "on_break";
  const isOnBreak = currentStatus === "on_break";

  const handleOnlineToggle = (checked: boolean) => {
    if (isLoading) return;
    if (checked) {
      onStatusChange("online");
    } else {
      onStatusChange("offline");
    }
  };

  const handleBreakToggle = () => {
    if (isLoading) return;
    if (isOnline) {
      if (isOnBreak) {
        onStatusChange("online"); // End break, go online
      } else {
        onStatusChange("on_break"); // Start break
      }
    }
  };

  const getTitleIcon = () => {
    if (isLoading) return <Loader2 className="mr-2 h-5 w-5 animate-spin" />;
    if (isOnline) {
      return isOnBreak ? <Coffee className="mr-2 text-yellow-500 h-5 w-5"/> : <Zap className="mr-2 text-green-500 h-5 w-5" />;
    }
    return <ZapOff className="mr-2 text-red-500 h-5 w-5" />;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-[15px] font-semibold">
          {getTitleIcon()}
          Availability Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <Label htmlFor="online-toggle" className="text-lg font-medium">
            {isLoading ? "Updating..." : (isOnline ? "You are Online" : "You are Offline")}
          </Label>
          <Switch
            id="online-toggle"
            checked={isOnline}
            onCheckedChange={handleOnlineToggle}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
            aria-label={isOnline ? "Go Offline" : "Go Online"}
            disabled={isLoading}
          />
        </div>

        {isOnline && (
          <Button
            variant={isOnBreak ? "destructive" : "outline"}
            onClick={handleBreakToggle}
            className="w-full"
            aria-label={isOnBreak ? "End Break" : "Take a Break"}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            ) : isOnBreak ? (
              <Zap className="mr-2 h-4 w-4"/>
            ) : (
              <Coffee className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Please wait" : (isOnBreak ? "End Break" : "Take a Break")}
          </Button>
        )}
        <p className="text-sm text-muted-foreground text-center">
          { isLoading ? "Updating status..." :
            isOnline
            ? isOnBreak
              ? "You are currently on a break. You won't receive new orders."
              : "You are available to receive new delivery orders."
            : "You are offline and will not receive any new orders."
          }
        </p>
      </CardContent>
    </Card>
  );
}
