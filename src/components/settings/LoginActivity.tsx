
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Smartphone, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Session } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Helper function to parse User Agent string
const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return { name: "Unknown Device", icon: Laptop };

    if (/android/i.test(userAgent)) return { name: "Android Device", icon: Smartphone };
    if (/iphone|ipad|ipod/i.test(userAgent)) return { name: "iOS Device", icon: Smartphone };
    if (/windows/i.test(userAgent)) return { name: "Windows PC", icon: Laptop };
    if (/macintosh/i.test(userAgent)) return { name: "Mac", icon: Laptop };

    return { name: "Web Browser", icon: Laptop };
};


export function LoginActivity() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            setSessions([]);
            return;
        }

        setLoading(true);
        const sessionsQuery = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid),
            orderBy("loginTimestamp", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            const fetchedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Session));
            setSessions(fetchedSessions);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching sessions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }
    
    // Check for unrecognized devices (for demo purposes, checks for "Unknown Device")
    const hasUnrecognizedLogin = sessions.some(s => getDeviceInfo(s.userAgent).name === 'Unknown Device');

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Login Activity</CardTitle>
                <CardDescription>Recent login sessions for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Loading sessions...</span>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {sessions.map((session, index) => {
                            const { name: deviceName, icon: DeviceIcon } = getDeviceInfo(session.userAgent);
                            const isActive = !session.logoutTimestamp;

                            return (
                                <li key={session.id} className="flex items-center gap-4">
                                    <DeviceIcon className="h-6 w-6 text-muted-foreground"/>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{deviceName}</p>
                                        <p className={cn("text-sm", isActive ? "text-green-600" : "text-muted-foreground")}>
                                            {session.location || "Unknown Location"} - {isActive ? <span className="font-bold">Active Now</span> : `Logged out ${formatTimestamp(session.logoutTimestamp)}`}
                                        </p>
                                    </div>
                                    {isActive && index === 0 && <CheckCircle className="h-5 w-5 text-green-500" />}
                                </li>
                            );
                        })}
                    </ul>
                )}
                 {hasUnrecognizedLogin && (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Unrecognized Login Detected</AlertTitle>
                        <AlertDescription>
                            We detected a login from an unrecognized device. If this wasn't you, please secure your account immediately.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
