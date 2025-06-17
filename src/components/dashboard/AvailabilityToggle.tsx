
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Coffee, ZapOff } from "lucide-react";

export function AvailabilityToggle() {
  const [isOnline, setIsOnline] = useState(true);
  const [isOnBreak, setIsOnBreak] = useState(false);

  const handleOnlineToggle = (checked: boolean) => {
    setIsOnline(checked);
    if (!checked) {
      setIsOnBreak(false); // Can't be on break if offline
    }
  };

  const handleBreakToggle = () => {
    if (isOnline) {
      setIsOnBreak(!isOnBreak);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {isOnline ? (isOnBreak ? <Coffee className="mr-2 text-yellow-500"/> : <Zap className="mr-2 text-green-500" />) : <ZapOff className="mr-2 text-red-500" />}
          Availability Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <Label htmlFor="online-toggle" className="text-lg font-medium">
            {isOnline ? "You are Online" : "You are Offline"}
          </Label>
          <Switch
            id="online-toggle"
            checked={isOnline}
            onCheckedChange={handleOnlineToggle}
            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
            aria-label={isOnline ? "Go Offline" : "Go Online"}
          />
        </div>
        
        {isOnline && (
          <Button
            variant={isOnBreak ? "destructive" : "outline"}
            onClick={handleBreakToggle}
            className="w-full"
            aria-label={isOnBreak ? "End Break" : "Take a Break"}
          >
            {isOnBreak ? <Zap className="mr-2 h-4 w-4"/> : <Coffee className="mr-2 h-4 w-4" />}
            {isOnBreak ? "End Break" : "Take a Break"}
          </Button>
        )}
        <p className="text-sm text-muted-foreground text-center">
          {isOnline ? (isOnBreak ? "You are currently on a break. You won't receive new orders." : "You are available to receive new delivery orders.") : "You are offline and will not receive any new orders."}
        </p>
      </CardContent>
    </Card>
  );
}
