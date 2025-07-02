"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, PiggyBank } from "lucide-react";
import Link from "next/link";

const stats = [
    {
        title: "This Month’s Earnings",
        amount: "25,120.00",
        description: "As of today",
        icon: Calendar,
        color: "text-green-500",
        href: "/earnings/history"
    },
    {
        title: "Total Lifetime Earnings",
        amount: "1,45,890.75",
        description: "Since joining",
        icon: PiggyBank,
        color: "text-purple-500",
    },
];

export function EarningsSummaryCard() {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {stats.map((stat) => {
                const CardComponent = (
                     <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stat.color}`}>
                                ₹{stat.amount}
                            </div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                );

                if (stat.href) {
                    return (
                        <Link href={stat.href} key={stat.title} className="block hover:no-underline">
                           {CardComponent}
                        </Link>
                    );
                }
                
                return <div key={stat.title}>{CardComponent}</div>;
            })}
        </div>
    );
}
