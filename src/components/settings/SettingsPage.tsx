
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
  Info,
  ChevronRight,
  ShieldQuestion,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { LoginActivity } from "./LoginActivity";
import { Input } from "@/components/ui/input";


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
    <div>
        <div>
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground mt-1 hidden md:block">Manage your app preferences and settings.</p>
        </div>

      <div className="space-y-1">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" /> Notifications</CardTitle>
          <CardDescription>
            Choose what alerts you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="new-orders" className="font-medium">
              New Orders
            </Label>
            <Switch id="new-orders" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="announcements" className="font-medium">
              Announcements & Incentives
            </Label>
            <Switch id="announcements" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="shift-reminders" className="font-medium">
              Shift Reminders
            </Label>
            <Switch id="shift-reminders" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center"><ShieldQuestion className="mr-2 h-5 w-5" /> Permissions</CardTitle>
              <CardDescription>Manage app access to your device features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label className="font-medium">Location Access</Label>
                  <p className="text-sm text-green-600 font-semibold">Allowed</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label className="font-medium">Camera Access</Label>
                   <p className="text-sm text-green-600 font-semibold">Allowed</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label className="font-medium">Notifications</Label>
                   <p className="text-sm text-green-600 font-semibold">Allowed</p>
              </div>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4"/>
                    Manage in Device Settings
                </div>
                <ChevronRight className="h-4 w-4"/>
              </Button>
          </CardContent>
      </Card>
      
      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center"><Siren className="mr-2 h-5 w-5" /> Emergency SOS</CardTitle>
              <CardDescription>Configure your emergency contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="emergency-contact">Emergency Contact Number</Label>
                <Input id="emergency-contact" type="tel" placeholder="+91 98765 43210" />
              </div>
              <Button className="w-full">Save Contact</Button>
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
                    <Button onClick={copyToClipboard} variant="outline" size="icon" disabled={!referralCode}>
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
    </div>
  );
}
