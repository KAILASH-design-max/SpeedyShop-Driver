
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Laptop, Smartphone, Loader2, AlertTriangle, CheckCircle, LogOut, ArrowLeft } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Session } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { endAllOtherSessions } from "@/lib/sessionManager";


// Helper function to parse User Agent string
const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return { name: "Unknown Device", icon: Laptop };

    if (/android/i.test(userAgent)) return { name: "Android Device", icon: Smartphone };
    if (/iphone|ipad|ipod/i.test(userAgent)) return { name: "iOS Device", icon: Smartphone };
    if (/windows/i.test(userAgent)) return { name: "Windows PC", icon: Laptop };
    if (/macintosh/i.test(userAgent)) return { name: "Mac", icon: Laptop };

    return { name: "Web Browser", icon: Laptop };
};


export default function LoginActivityPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

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
        // Modified query to remove orderBy to prevent index error.
        // Sorting will be done on the client.
        const sessionsQuery = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid),
            limit(20) // Fetch more to sort accurately
        );

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            let fetchedSessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Session));

            // Sort on the client side
            fetchedSessions.sort((a, b) => {
                const timeA = a.loginTimestamp?.seconds || 0;
                const timeB = b.loginTimestamp?.seconds || 0;
                return timeB - timeA;
            });

            // Limit to the most recent 5 after sorting
            setSessions(fetchedSessions.slice(0, 5));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching sessions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleLogoutFromAll = async () => {
        if (!currentUser) return;
        setIsLoggingOut(true);
        try {
            await endAllOtherSessions(currentUser.uid);
            toast({
                title: "Success",
                description: "You have been logged out from all other devices.",
                className: "bg-green-500 text-white"
            });
        } catch (error) {
            console.error("Error logging out from all devices:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not log out from other devices. Please try again."
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }
    
    // Check for unrecognized devices (for demo purposes, checks for "Unknown Device")
    const hasUnrecognizedLogin = sessions.some(s => getDeviceInfo(s.userAgent).name === 'Unknown Device');

    return (
        <div className="p-6 space-y-6">
            <Card className="shadow-xl">
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
                <CardFooter className="border-t pt-4">
                    <Button variant="outline" className="w-full" onClick={handleLogoutFromAll} disabled={isLoggingOut}>
                        {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogOut className="mr-2 h-4 w-4"/>}
                        {isLoggingOut ? "Logging out..." : "Log out from all other devices"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
