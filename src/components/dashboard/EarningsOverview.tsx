
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Truck, Badge, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const staticStats = [
    {
        title: "Current Week Earnings",
        value: "255.75",
        subtext: "Total earnings this week",
        icon: Wallet,
        color: "text-green-500",
        href: "/earnings",
        isCurrency: true
    },
    {
        title: "Active Bonuses",
        value: "2",
        subtext: "Bonuses you're working towards",
        icon: Badge,
        color: "text-orange-500",
        href: "/bonuses",
        isCurrency: false
    },
    {
        title: "Overall Rating",
        value: "4.7/5",
        subtext: "Your average customer rating",
        icon: Star,
        color: "text-yellow-500",
        href: "/profile",
        isCurrency: false
    },
];

export function EarningsOverview() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deliveriesToday, setDeliveriesToday] = useState(0);
    const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (!user) {
                setIsLoadingDeliveries(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            if(!auth.currentUser) setIsLoadingDeliveries(false);
            return;
        };

        setIsLoadingDeliveries(true);
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const deliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("orderStatus", "==", "delivered"),
            where("completedAt", ">=", startOfToday),
            where("completedAt", "<=", endOfToday)
        );

        const unsubscribe = onSnapshot(deliveriesQuery, (snapshot) => {
            setDeliveriesToday(snapshot.size);
            setIsLoadingDeliveries(false);
        }, (error) => {
            console.error("Error fetching deliveries count:", error);
            setIsLoadingDeliveries(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const allStats = [
        staticStats[0],
        {
            title: "Deliveries Today",
            value: deliveriesToday,
            subtext: "Completed orders today",
            icon: Truck,
            color: "text-blue-500",
            href: "/orders",
            isCurrency: false,
            isLoading: isLoadingDeliveries,
        },
        staticStats[1],
        staticStats[2]
    ];
    
    return (
        <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {allStats.map((stat) => (
                    <Link href={stat.href} key={stat.title} className="block hover:no-underline">
                        <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stat.color}`}>
                                    {stat.isLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            {stat.isCurrency && "₹"}{stat.value}
                                        </>
                                    )}
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
