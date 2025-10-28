
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Route,
  IndianRupee,
  User as UserIcon,
  MessagesSquare,
  LogOut,
  Menu,
  Truck,
  LifeBuoy,
  Trophy,
  Users,
  BookOpen,
  Settings,
  HelpCircle,
  Megaphone,
  BarChart,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { endSession } from "@/lib/sessionManager";
import { ActiveTimeTracker } from "@/components/dashboard/ActiveTimeTracker";
import { ThemeToggle } from "./ThemeToggle";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Profile } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/smart-routing", label: "Smart Routing", icon: Route },
  { href: "/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/analytics", label: "Analytics", icon: BarChart },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
];

const bottomNavItems = [
  { href: "/support", label: "Help & Info", icon: HelpCircle },
];

const mobileNavItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/chat", label: "Chat", icon: MessagesSquare },
    { href: "/settings", label: "Settings", icon: Settings },
]

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
        if(!user) {
            setProfile(null);
            router.push('/');
        }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
      if (currentUser) {
          const profileRef = doc(db, "users", currentUser.uid);
          const unsubscribe = onSnapshot(profileRef, (docSnap) => {
              if (docSnap.exists()) {
                  const profileData = docSnap.data() as Profile;
                  setProfile(profileData);
              } else {
                  setProfile(null);
              }
          }, (error) => {
               console.error("Error fetching user profile:", error);
          });
          return () => unsubscribe();
      }
  }, [currentUser]);


  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  

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

  const navItems = [
    ...baseNavItems,
    ...(profile?.verificationStatus === 'pending' ? [{ href: "/training", label: "Training", icon: BookOpen }] : []),
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">
              SpeedyDelivery
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    className={cn(
                      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <SidebarMenu>
             {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton
                      className={cn(
                        pathname.startsWith(item.href)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                  <Link href="/profile" passHref>
                      <SidebarMenuButton
                          className={cn(
                          pathname === "/profile"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          isActive={pathname === "/profile"}
                           tooltip={{ children: "Profile", className: "group-data-[collapsible=icon]:block hidden" }}
                      >
                          <UserIcon className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">Profile</span>
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/settings" passHref>
                      <SidebarMenuButton
                          className={cn(
                          pathname === "/settings"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          isActive={pathname === "/settings"}
                           tooltip={{ children: "Settings", className: "group-data-[collapsible=icon]:block hidden" }}
                      >
                          <Settings className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={handleLogout}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      tooltip={{ children: "Logout", className: "group-data-[collapsible=icon]:block hidden" }}
                  >
                      <LogOut className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 md:flex">
              <ActiveTimeTracker />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
            </div>
             {profile && (
              <Link href="/profile">
                  <Avatar className="h-9 w-9 border-2 border-transparent hover:border-primary transition-colors">
                      <AvatarImage src={profile.profilePictureUrl || undefined} alt={profile.name} />
                      <AvatarFallback>{profile.name?.substring(0,2).toUpperCase() || 'P'}</AvatarFallback>
                  </Avatar>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
        </main>
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background md:hidden">
          <div className="grid h-16 grid-cols-3">
            {mobileNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-sm font-medium",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
