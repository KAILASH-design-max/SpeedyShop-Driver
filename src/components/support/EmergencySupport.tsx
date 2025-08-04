
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EmergencySupport() {
  const { toast } = useToast();

  const handleSosClick = () => {
    // In a real app, this would trigger a backend process to alert your emergency team.
    // It would send the user's ID, last known location, and a timestamp.
    console.log("SOS TRIGGERED BY USER:", auth.currentUser?.uid);
    
    toast({
      variant: "destructive",
      title: "SOS Signal Sent",
      description: "Emergency services have been notified of your location. Please stay safe.",
      duration: 10000,
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
            <CardDescription className="text-destructive/80">For urgent safety concerns.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <p className="text-sm text-destructive/90 mb-2">
            For accidents or critical safety issues, press the SOS button to alert our team immediately.
            </p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full text-lg font-bold py-6">
                        <Siren className="mr-2 h-5 w-5" /> SOS – Request Help
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Emergency SOS</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to trigger an emergency SOS? This will immediately alert our response team with your location. Use only for genuine emergencies.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSosClick} className="bg-destructive hover:bg-destructive/90">
                        Yes, I Need Help
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
         <div>
            <p className="text-sm text-muted-foreground mb-2">
             For less urgent issues, you can call our support line directly.
            </p>
             <a href="tel:+911234567890" className="w-full">
                <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive">
                   <Phone className="mr-2 h-4 w-4" /> Call Support
                </Button>
             </a>
        </div>
      </CardContent>
    </Card>
  );
}
