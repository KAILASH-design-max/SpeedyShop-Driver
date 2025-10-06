
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Moon,
  Languages,
  LogOut,
  IndianRupee,
  BarChart,
  Trophy,
  Users,
  MessagesSquare,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import type { Profile } from "@/types";
import { endSession } from "@/lib/sessionManager";
import { AvailabilityToggle } from "../dashboard/AvailabilityToggle";
import Link from "next/link";

const mainNavItems = [
  { href: "/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/analytics", label: "Analytics", icon: BarChart },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
];

const supportNavItems = [
    { href: "/support", label: "Help & Info", icon: HelpCircle },
]

export function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const { theme, setTheme } = useTheme();
    const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus'] | undefined>(undefined);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
      if (currentUser) {
        const profileRef = doc(db, "users", currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            setIsAvailabilityLoading(true);
            if (docSnap.exists()) {
                const profileData = docSnap.data() as Profile;
                setProfile(profileData);
                if (profileData.availabilityStatus === undefined) {
                    updateDoc(profileRef, { availabilityStatus: 'offline' });
                    setAvailabilityStatus('offline');
                } else {
                    setAvailabilityStatus(profileData.availabilityStatus);
                }
            } else {
                setProfile(null);
                setAvailabilityStatus('offline');
            }
            setIsAvailabilityLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setIsAvailabilityLoading(false);
        setAvailabilityStatus(undefined);
      }
    }, [currentUser]);

    const handleAvailabilityChange = async (newStatus: Required<Profile['availabilityStatus']>) => {
        if (!currentUser) {
          toast({ variant: "destructive", title: "Error", description: "Not logged in." });
          return;
        }
        setIsAvailabilityLoading(true);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await updateDoc(userDocRef, { availabilityStatus: newStatus });
          setAvailabilityStatus(newStatus);
          toast({ title: "Status Updated", description: `You are now ${newStatus}.`, className: newStatus === 'online' ? "bg-green-500 text-white" : "" });
        } catch (error) {
          console.error("Error updating availability status:", error);
          toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
        } finally {
          setIsAvailabilityLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
          await endSession();
          await signOut(auth);
          toast({ title: "Logged Out", description: "You have been successfully logged out." });
          router.push("/");
        } catch (error) {
          console.error("Logout error:", error);
          toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
        }
      };
      
    const handleThemeChange = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };

  return (
    <div className="space-y-6">
        <header className="flex items-center gap-3">
            <Settings className="h-7 w-7 text-foreground" />
            <h1 className="text-2xl font-bold">Settings</h1>
        </header>

        {profile && (
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.profilePictureUrl} alt={profile.name} />
                    <AvatarFallback>{profile.name?.substring(0, 2).toUpperCase() || 'P'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-xl font-bold">{profile.name}</p>
                    <p className="text-muted-foreground">{profile.email}</p>
                </div>
            </div>
        )}
        
        <Separator />

        <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg p-3">
                <AvailabilityToggle
                    currentStatus={availabilityStatus}
                    onStatusChange={handleAvailabilityChange}
                    isLoading={isAvailabilityLoading}
                />
            </div>
             <Separator />

            {mainNavItems.map((item) => (
                <Link href={item.href} key={item.label} className="block">
                     <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary">
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
            ))}
             <Separator />

             {supportNavItems.map((item) => (
                <Link href={item.href} key={item.label} className="block">
                     <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary">
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
            ))}

             <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted">
                <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Dark Mode</span>
                </div>
                <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeChange}
                    aria-label="Toggle dark mode"
                />
            </div>
             <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted">
                <div className="flex items-center gap-3">
                    <Languages className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Language</span>
                </div>
                <span className="text-muted-foreground">English</span>
            </div>
        </div>

        <Separator />

        <Button variant="outline" className="w-full justify-center h-12 text-base text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            Log out
        </Button>
    </div>
  );
}
