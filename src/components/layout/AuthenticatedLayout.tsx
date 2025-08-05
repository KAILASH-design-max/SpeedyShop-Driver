
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { endSession } from "@/lib/sessionManager";
import { ActiveTimeTracker } from "@/components/dashboard/ActiveTimeTracker";
import { ThemeToggle } from "./ThemeToggle";
import { doc, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Profile } from "@/types";
import { DeviceStatusMonitor } from "./DeviceStatusMonitor";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/smart-routing", label: "Smart Routing", icon: Route },
  { href: "/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/communication", label: "Messages", icon: MessagesSquare },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

function MobileNav() {
    const { toggleSidebar } = useSidebar();
    return (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Navigation</span>
        </Button>
    )
}


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeUnload = () => {
      // This will attempt to end the session when the tab is closed.
      // Note: This is not guaranteed to complete, especially on mobile browsers.
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

  const isHistoryPage = pathname.includes('/earnings/history');

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">
              Velocity
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
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <div className="flex items-center gap-4">
                <MobileNav />
                {!isHistoryPage && (
                  <>
                    <ActiveTimeTracker />
                  </>
                )}
            </div>
            <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
            </div>
        </header>
        <main className="flex-1 overflow-auto">
            {children}
        </main>
        <DeviceStatusMonitor />
      </SidebarInset>
    </SidebarProvider>
  );
}
