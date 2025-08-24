
"use client";

import { useState, useEffect } from "react";
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
  Smartphone,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { LoginActivity } from "./LoginActivity";
import { Input } from "@/components/ui/input";
import type { User } from "firebase/auth";


export function SettingsPage() {
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);
    
    const referralCode = currentUser ? `VELOCITY-${currentUser.uid.substring(0, 8).toUpperCase()}` : '';

    const copyToClipboard = () => {
        if (!referralCode) return;
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
            <p className="text-muted-foreground mt-1 hidden md:block">Manage your app preferences and account security.</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
        <div className="space-y-6">
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
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center"><Lock className="mr-2 h-5 w-5" /> Account Security</CardTitle>
                    <CardDescription>Manage your password and session history.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between">
                        Change Password
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </CardContent>
            </Card>
             <LoginActivity />
        </div>
      </div>
    </div>
  );
}
