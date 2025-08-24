
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Star, Loader2, IndianRupee, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Order, Profile, DeliveryRating } from "@/types";
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

const staticStats = [
    {
        title: "Active Achievements",
        value: "3",
        subtext: "Challenges you're working on",
        icon: Trophy,
        color: "text-orange-500",
        href: "/achievements",
        isCurrency: false,
        isLoading: false, // This is static,
    },
];

export function EarningsOverview() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deliveriesToday, setDeliveriesToday] = useState(0);
    const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
    const [currentWeekEarnings, setCurrentWeekEarnings] = useState(0);
    const [isLoadingWeekEarnings, setIsLoadingWeekEarnings] = useState(true);
    const [overallRating, setOverallRating] = useState<number | null>(0);
    const [isLoadingRatings, setIsLoadingRatings] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (!user) {
                setIsLoadingDeliveries(false);
                setIsLoadingRatings(false);
                setIsLoadingWeekEarnings(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            if(!auth.currentUser) {
                setIsLoadingDeliveries(false);
                setIsLoadingRatings(false);
                setIsLoadingWeekEarnings(false);
            }
            return;
        };

        setIsLoadingDeliveries(true);
        setIsLoadingWeekEarnings(true);
        setIsLoadingRatings(true);

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        
        // --- Ratings Listener ---
        const ratingsQuery = query(collection(db, 'deliveryPartnerRatings'), where('deliveryPartnerId', '==', currentUser.uid));
        const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
            const ratings = snapshot.docs.map(doc => doc.data() as DeliveryRating);
            if (ratings.length > 0) {
                 const total = ratings.reduce((acc, r) => acc + r.rating, 0);
                 setOverallRating(total / ratings.length);
            } else {
                 setOverallRating(0);
            }
            setIsLoadingRatings(false);
        }, (error) => {
             console.error("Error fetching ratings:", error);
             setOverallRating(null);
             setIsLoadingRatings(false);
        });

        // --- Weekly Deliveries and Earnings Logic ---
        const weekDeliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("status", "==", "delivered"),
            where("completedAt", ">=", weekStart),
            where("completedAt", "<=", weekEnd)
        );

        const unsubscribeDeliveries = onSnapshot(weekDeliveriesQuery, (snapshot) => {
            let totalWeeklyEarnings = 0;
            let deliveriesTodayCount = 0;
            
            snapshot.forEach(doc => {
                const orderData = doc.data() as Order;
                const earning = (orderData.estimatedEarnings ?? 0) + (orderData.tipAmount ?? 0);
                totalWeeklyEarnings += earning;
                
                const completedAtTimestamp = orderData.completedAt as Timestamp;
                if (completedAtTimestamp) {
                    const completedDate = completedAtTimestamp.toDate();
                    if (completedDate >= todayStart && completedDate <= todayEnd) {
                        deliveriesTodayCount++;
                    }
                }
            });

            setCurrentWeekEarnings(totalWeeklyEarnings);
            setDeliveriesToday(deliveriesTodayCount);
            setIsLoadingDeliveries(false);
            setIsLoadingWeekEarnings(false);

        }, (error) => {
            console.error("Error fetching weekly deliveries:", error);
            setIsLoadingWeekEarnings(false);
            setIsLoadingDeliveries(false);
        });

        return () => {
            unsubscribeDeliveries();
            unsubscribeRatings();
        };
    }, [currentUser]);


    const allStats = [
        {
            title: "Current Week Earnings",
            value: isLoadingWeekEarnings ? null : currentWeekEarnings.toFixed(2),
            subtext: "Includes deliveries and tips",
            icon: IndianRupee,
            color: "text-green-500",
            href: "/earnings/history",
            isCurrency: true,
            isLoading: isLoadingWeekEarnings,
        },
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
        ...staticStats,
        {
            title: "Overall Rating",
            value: isLoadingRatings ? null : (overallRating !== null ? `${overallRating.toFixed(1)}/5` : "N/A"),
            subtext: "Your average customer rating",
            icon: Star,
            color: "text-yellow-500",
            href: "/ratings",
            isCurrency: false,
            isLoading: isLoadingRatings,
        },
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
