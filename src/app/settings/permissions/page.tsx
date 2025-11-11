
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, Bell, CheckCircle, AlertTriangle, HelpCircle, Settings, ArrowLeft } from "lucide-react";
import { useAppPermissions, type PermissionState } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const permissionItems = [
    { name: "Location", key: "location", icon: MapPin, description: "Required for navigation and to receive relevant, nearby order alerts." },
    { name: "Camera", key: "camera", icon: Camera, description: "Needed for photo proof of delivery and document uploads." },
    { name: "Notifications", key: "notifications", icon: Bell, description: "For new order alerts and other important updates." },
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
    alert("To change app permissions, please go to your browser's settings for this site. This is usually found by clicking the lock icon next to the URL.");
}

export default function AppPermissionsPage() {
    const permissions = useAppPermissions();
    const router = useRouter();

    return (
        <div className="space-y-6 p-4 md:p-6">
            <Card className="shadow-none md:shadow-xl rounded-none md:rounded-lg border-x-0 md:border">
                <CardHeader className="px-4 md:px-6">
                    <CardTitle className="flex items-center text-2xl font-bold text-primary">
                        <Settings className="mr-3 h-6 w-6"/>
                        App Permissions
                    </CardTitle>
                    <CardDescription>
                        Manage permissions for location, camera, and notifications to ensure the app functions correctly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                    {permissionItems.map(item => {
                        const permission = permissions[item.key];
                        const statusInfo = getStatusInfo(permission.status);
                        return (
                            <div key={item.key} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/30 gap-4">
                                <div className="flex items-start gap-4">
                                    <item.icon className="h-6 w-6 text-primary mt-1"/>
                                    <div>
                                        <p className="font-semibold text-base">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <Badge variant={statusInfo.variant as any} className="capitalize">
                                        <statusInfo.icon className="mr-1.5 h-3 w-3"/>
                                        {statusInfo.text}
                                    </Badge>
                                    {permission.status === 'denied' && (
                                        <Button size="sm" variant="outline" onClick={openAppSettings}>
                                            Settings
                                        </Button>
                                    )}
                                    {permission.status === 'prompt' && (
                                        <Button size="sm" variant="default" onClick={permission.request}>
                                            Request Access
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
