
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Truck, Badge, Star } from "lucide-react";
import Link from "next/link";

const overviewStats = [
    {
        title: "Current Week Earnings",
        value: "255.75",
        subtext: "Total earnings this week",
        icon: Wallet,
        color: "text-green-500",
        href: "/earnings"
    },
    {
        title: "Deliveries Today",
        value: "8",
        subtext: "Completed orders today",
        icon: Truck,
        color: "text-blue-500",
        href: "/orders"
    },
    {
        title: "Active Bonuses",
        value: "2",
        subtext: "Bonuses you're working towards",
        icon: Badge,
        color: "text-orange-500",
        href: "/earnings"
    },
    {
        title: "Overall Rating",
        value: "4.7/5",
        subtext: "Your average customer rating",
        icon: Star,
        color: "text-yellow-500",
        href: "/profile"
    },
];

export function EarningsOverview() {
    return (
        <div className="mb-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overviewStats.map((stat) => (
                    <Link href={stat.href} key={stat.title} className="block hover:no-underline">
                        <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stat.color}`}>
                                    {stat.title.includes("Earnings") && "₹"}{stat.value}
                                </div>
                                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
