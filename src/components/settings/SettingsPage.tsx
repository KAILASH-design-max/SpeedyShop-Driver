
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
  ChevronRight,
  Banknote
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
import { useLanguage } from "@/context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ActiveTimeTracker } from "../dashboard/ActiveTimeTracker";
import { ProfileForm } from "../profile/ProfileForm";


const mainNavItems = [
  { href: "/earnings", labelKey: "earnings", icon: IndianRupee },
  { href: "/analytics", labelKey: "analytics", icon: BarChart },
  { href: "/achievements", labelKey: "achievements", icon: Trophy },
  { href: "/community", labelKey: "community", icon: Users },
];

const supportNavItems = [
    { href: "/support", labelKey: "help_info", icon: HelpCircle },
]

export function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const { theme, setTheme } = useTheme();
    const [availabilityStatus, setAvailabilityStatus] = useState<Profile['availabilityStatus'] | undefined>(undefined);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);
    const { language, setLanguage, translations } = useLanguage();
    const [isLangDialogOpen, setLangDialogOpen] = useState(false);

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

    const handleProfileUpdate = async (updatedData: Partial<Profile>) => {
        if (!currentUser) return;
        const profileRef = doc(db, "users", currentUser.uid);
        try {
            await updateDoc(profileRef, updatedData);
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved.",
                className: "bg-green-500 text-white",
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes." });
        }
    };

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
          toast({ title: translations.logged_out, description: translations.logged_out_desc });
          router.push("/");
        } catch (error) {
          console.error("Logout error:", error);
          toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
        }
      };
      
    const handleThemeChange = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };
    
    const handleLanguageChange = (lang: 'en' | 'hi') => {
        setLanguage(lang);
        setLangDialogOpen(false);
    }

  return (
    <div className="space-y-6">
        {profile && (
             <Link href="/profile" className="block">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted active:bg-secondary">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.profilePictureUrl} alt={profile.name} />
                        <AvatarFallback>{profile.name?.substring(0, 2).toUpperCase() || 'P'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="text-xl font-bold">{profile.name}</p>
                        <p className="text-muted-foreground">View your profile</p>
                    </div>
                     <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </Link>
        )}
        
        <Separator />

        <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg p-3">
                <AvailabilityToggle
                    currentStatus={availabilityStatus}
                    onStatusChange={handleAvailabilityChange}
                    isLoading={isAvailabilityLoading}
                />
                <div className="md:hidden">
                    <ActiveTimeTracker />
                </div>
            </div>
             <Separator />

            {mainNavItems.map((item) => (
                <Link href={item.href} key={item.labelKey} className="block">
                     <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary">
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{translations[item.labelKey]}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
            ))}
             <Separator />
             
            {profile && (
                 <ProfileForm profile={profile} onUpdate={handleProfileUpdate}>
                    <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Banknote className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Payment Settings</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </ProfileForm>
            )}


             {supportNavItems.map((item) => (
                <Link href={item.href} key={item.labelKey} className="block">
                     <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary">
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{translations[item.labelKey]}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
            ))}

             <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted">
                <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{translations.dark_mode}</span>
                </div>
                <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeChange}
                    aria-label="Toggle dark mode"
                />
            </div>
             <Dialog open={isLangDialogOpen} onOpenChange={setLangDialogOpen}>
                <DialogTrigger asChild>
                    <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted active:bg-secondary cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Languages className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{translations.language}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-muted-foreground">{language === 'hi' ? 'हिंदी' : 'English'}</span>
                           <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translations.select_language}</DialogTitle>
                    </DialogHeader>
                    <RadioGroup defaultValue={language} onValueChange={(value) => handleLanguageChange(value as 'en' | 'hi')} className="py-4 space-y-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="en" id="lang-en" />
                            <Label htmlFor="lang-en" className="text-base font-normal">English</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hi" id="lang-hi" />
                            <Label htmlFor="lang-hi" className="text-base font-normal">हिंदी (Hindi)</Label>
                        </div>
                    </RadioGroup>
                </DialogContent>
             </Dialog>
        </div>

        <Separator />

        <Button variant="outline" className="w-full justify-center h-12 text-base text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            {translations.log_out}
        </Button>
    </div>
  );
}
