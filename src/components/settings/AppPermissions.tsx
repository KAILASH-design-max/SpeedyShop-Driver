
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Camera, Bell, CheckCircle, AlertTriangle, HelpCircle, Settings } from "lucide-react";
import { useAppPermissions, type PermissionState } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const permissionItems = [
    { name: "Location", key: "location", icon: MapPin, description: "Required for navigation and order assignment." },
    { name: "Camera", key: "camera", icon: Camera, description: "Needed for photo proof of delivery." },
    { name: "Notifications", key: "notifications", icon: Bell, description: "For new order alerts and important updates." },
] as const;

const getStatusInfo = (status: PermissionState) => {
    switch (status) {
        case 'granted':
            return { text: "Allowed", variant: "default", icon: CheckCircle };
        case 'denied':
            return { text: "Blocked", variant: "destructive", icon: AlertTriangle };
        case 'prompt':
        default:
            return { text: "Ask First", variant: "secondary", icon: HelpCircle };
    }
}

const openAppSettings = () => {
    // This is a best-effort attempt. It won't work in all browsers/OSes.
    // The primary goal is to guide the user.
    alert("To change app permissions, please go to your browser's settings for this site. This is usually found by clicking the lock icon next to the URL.");
}

export function AppPermissions() {
    const permissions = useAppPermissions();

    return (
        <>
            <Separator />
            <div className="flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">App Permissions</span>
                </div>
            </div>
            <div className="pl-3 pr-3 pb-3 space-y-2">
                {permissionItems.map(item => {
                    const status = permissions[item.key];
                    const statusInfo = getStatusInfo(status);
                    return (
                        <div key={item.key} className="p-3 border rounded-lg flex items-center justify-between bg-muted/20">
                            <div className="flex items-center gap-3">
                                <item.icon className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={statusInfo.variant as any} className="capitalize hidden sm:inline-flex">
                                    <statusInfo.icon className="mr-1.5 h-3 w-3"/>
                                    {statusInfo.text}
                                </Badge>
                                {status === 'denied' && (
                                    <Button size="sm" variant="outline" onClick={openAppSettings}>
                                        Settings
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    );
}
