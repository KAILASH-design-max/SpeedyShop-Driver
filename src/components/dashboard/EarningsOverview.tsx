
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Truck, Badge, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Profile } from "@/types";

const staticStats = [
    {
        title: "Active Bonuses",
        value: "2",
        subtext: "Bonuses you're working towards",
        icon: Badge,
        color: "text-orange-500",
        href: "/bonuses",
        isCurrency: false
    },
];

export function EarningsOverview() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deliveriesToday, setDeliveriesToday] = useState(0);
    const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
    const [currentWeekEarnings, setCurrentWeekEarnings] = useState(0);
    const [isLoadingWeekEarnings, setIsLoadingWeekEarnings] = useState(true);
    const [overallRating, setOverallRating] = useState<number | null>(null);
    const [isLoadingRating, setIsLoadingRating] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (!user) {
                setIsLoadingDeliveries(false);
                setIsLoadingRating(false);
                setIsLoadingWeekEarnings(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            if(!auth.currentUser) {
                setIsLoadingDeliveries(false);
                setIsLoadingRating(false);
                setIsLoadingWeekEarnings(false);
            }
            return;
        };

        setIsLoadingDeliveries(true);
        setIsLoadingWeekEarnings(true);
        setIsLoadingRating(true);

        // --- Weekly Deliveries and Earnings Logic ---
        const today = new Date();
        const day = today.getDay(); // Sunday = 0, Monday = 1
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust so Monday is the first day
        const startOfWeek = new Date(new Date().setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        const weekDeliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("orderStatus", "==", "delivered"),
            where("completedAt", ">=", startOfWeek)
        );

        const unsubscribeDeliveries = onSnapshot(weekDeliveriesQuery, (snapshot) => {
            let totalEarnings = 0;
            let deliveriesTodayCount = 0;
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            snapshot.forEach(doc => {
                const orderData = doc.data();
                const earning = orderData.estimatedEarnings ?? orderData.deliveryCharge ?? 0;
                totalEarnings += earning;
                
                const completedAtTimestamp = orderData.completedAt as Timestamp;
                if (completedAtTimestamp) {
                    const completedDate = completedAtTimestamp.toDate();
                    if (completedDate >= startOfToday) {
                        deliveriesTodayCount++;
                    }
                }
            });

            setCurrentWeekEarnings(totalEarnings);
            setDeliveriesToday(deliveriesTodayCount);
            setIsLoadingWeekEarnings(false);
            setIsLoadingDeliveries(false);
        }, (error) => {
            console.error("Error fetching weekly deliveries:", error);
            setIsLoadingWeekEarnings(false);
            setIsLoadingDeliveries(false);
        });

        // --- Rating Logic ---
        const fetchRating = async () => {
            const userDocRef = doc(db, 'users', currentUser.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const profileData = docSnap.data() as Profile;
                    const ratings = profileData.deliveryRatings;
                     if (ratings && ratings.length > 0) {
                        const validRatings = ratings.filter(r => typeof r.rating === 'number' && r.rating >= 0);
                        if (validRatings.length > 0) {
                            const totalRatingValue = validRatings.reduce((acc, r) => acc + r.rating, 0);
                            const avgRating = totalRatingValue / validRatings.length;
                            setOverallRating(avgRating);
                        } else {
                            setOverallRating(0);
                        }
                    } else {
                        setOverallRating(0);
                    }
                } else {
                    setOverallRating(0);
                }
            } catch (error) {
                console.error("Error fetching user rating:", error);
                setOverallRating(0);
            } finally {
                setIsLoadingRating(false);
            }
        };

        fetchRating();


        return () => unsubscribeDeliveries();
    }, [currentUser]);

    const allStats = [
        {
            title: "Current Week Earnings",
            value: isLoadingWeekEarnings ? null : currentWeekEarnings.toFixed(2),
            subtext: "Total earnings this week",
            icon: Wallet,
            color: "text-green-500",
            href: "/earnings",
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
        staticStats[0],
        {
            title: "Overall Rating",
            value: isLoadingRating ? null : (overallRating !== null ? `${overallRating.toFixed(1)}/5` : "N/A"),
            subtext: "Your average customer rating",
            icon: Star,
            color: "text-yellow-500",
            href: "/ratings",
            isCurrency: false,
            isLoading: isLoadingRating,
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
