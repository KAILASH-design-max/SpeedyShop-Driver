
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin/chat", label: "Chat Hub", icon: MessageSquare },
  { href: "/admin/map", label: "Live Map", icon: Map },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="md:col-span-1">
            <Card>
                <CardContent className="p-2">
                    <nav className="flex flex-col gap-1">
                        {adminNavItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                pathname.startsWith(item.href)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                        ))}
                    </nav>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-3 h-full">
            {children}
        </div>
    </div>
  );
}
