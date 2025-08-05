
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Users,
  Copy,
  ShieldCheck,
  Siren,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { LoginActivity } from "./LoginActivity";


export function SettingsPage() {
    const { toast } = useToast();
    const currentUser = auth.currentUser;
    const referralCode = currentUser ? `VELOCITY-${currentUser.uid.substring(0, 8).toUpperCase()}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        toast({
            title: "Copied to Clipboard!",
            description: "Your referral code has been copied.",
        });
    };

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your app preferences and settings.</p>
        </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" /> Notifications</CardTitle>
          <CardDescription>
            Manage how you receive alerts from the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="push-notifications" className="font-medium">
              Push Notifications
            </Label>
            <Switch id="push-notifications" defaultChecked />
          </div>
           <p className="text-sm text-muted-foreground">
            You can manage detailed notification settings (sounds, vibration) for Velocity Driver from your phone's system settings.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Referral Program</CardTitle>
           <CardDescription>
            Invite other drivers and earn rewards when they sign up.
           </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
                <Label htmlFor="referral-code" className="font-medium">Your Unique Referral Code</Label>
                <div className="flex gap-2">
                    <input id="referral-code" type="text" value={referralCode} readOnly className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
                    <Button onClick={copyToClipboard} variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <LoginActivity />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5" /> Legal & Information</CardTitle>
           <CardDescription>
            View terms of service, privacy policy, and app information.
           </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1"><Siren className="mr-2 h-4 w-4"/>Terms of Service</Button>
            <Button variant="outline" className="flex-1"><ShieldCheck className="mr-2 h-4 w-4" />Privacy Policy</Button>
            <Button variant="outline" className="flex-1"><Info className="mr-2 h-4 w-4" />App Version: 1.0.0</Button>
        </CardContent>
      </Card>

    </div>
  );
}
