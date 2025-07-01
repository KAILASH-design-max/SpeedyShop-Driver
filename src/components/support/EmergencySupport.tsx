"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EmergencySupport() {
  const { toast } = useToast();

  const handleSosClick = () => {
    toast({
      variant: "destructive",
      title: "SOS Signal Sent",
      description: "Emergency services have been notified of your location. Please stay safe.",
      duration: 5000,
    });
  };

  return (
    <Card className="bg-destructive/10 border-destructive shadow-lg">
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <div className="p-3 rounded-full bg-destructive/20">
            <Siren className="h-6 w-6 text-destructive" />
        </div>
        <div className="flex-grow">
            <CardTitle className="text-destructive">Emergency Support</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-destructive/90 mb-4">
          For accidents or urgent safety concerns, press the SOS button.
        </p>
        <Button variant="destructive" className="w-full text-lg font-bold py-6" onClick={handleSosClick}>
          SOS – Request Help
        </Button>
      </CardContent>
    </Card>
  );
}
