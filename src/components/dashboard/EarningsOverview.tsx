
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Truck, Badge, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Profile, DeliveryRating } from "@/types";
import { startOfWeek, endOfWeek } from 'date-fns';

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
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (!user) {
                setIsLoadingDeliveries(false);
                setIsLoadingProfile(false);
                setIsLoadingWeekEarnings(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            if(!auth.currentUser) {
                setIsLoadingDeliveries(false);
                setIsLoadingProfile(false);
                setIsLoadingWeekEarnings(false);
            }
            return;
        };

        setIsLoadingDeliveries(true);
        setIsLoadingWeekEarnings(true);
        setIsLoadingProfile(true);

        // --- Profile Listener (for Rating and Tips) ---
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as Profile);
            } else {
                setProfile(null);
            }
            setIsLoadingProfile(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setProfile(null);
            setIsLoadingProfile(false);
        });


        // --- Weekly Deliveries and Earnings Logic ---
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        const weekDeliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("orderStatus", "==", "delivered"),
            where("completedAt", ">=", weekStart),
            where("completedAt", "<=", weekEnd)
        );

        const unsubscribeDeliveries = onSnapshot(weekDeliveriesQuery, (snapshot) => {
            let totalDeliveryEarnings = 0;
            let deliveriesTodayCount = 0;
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            snapshot.forEach(doc => {
                const orderData = doc.data();
                const earning = orderData.estimatedEarnings ?? orderData.deliveryCharge ?? 0;
                totalDeliveryEarnings += earning;
                
                const completedAtTimestamp = orderData.completedAt as Timestamp;
                if (completedAtTimestamp) {
                    const completedDate = completedAtTimestamp.toDate();
                    if (completedDate >= startOfToday) {
                        deliveriesTodayCount++;
                    }
                }
            });

            // This will be combined with tips once profile is loaded
            setCurrentWeekEarnings(totalDeliveryEarnings);
            setDeliveriesToday(deliveriesTodayCount);
            setIsLoadingDeliveries(false); // Base deliveries loaded
            setIsLoadingWeekEarnings(false); // Base earnings loaded

        }, (error) => {
            console.error("Error fetching weekly deliveries:", error);
            setIsLoadingWeekEarnings(false);
            setIsLoadingDeliveries(false);
        });

        return () => {
            unsubscribeDeliveries();
            unsubscribeProfile();
        };
    }, [currentUser]);

    // This effect combines delivery earnings and tips once both are loaded
    useEffect(() => {
        if (profile) {
            const today = new Date();
            const weekStart = startOfWeek(today, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

            const weeklyTips = profile.deliveryRatings?.reduce((acc, rating) => {
                if (rating.tip && rating.ratedAt?.toDate) {
                    const ratedDate = rating.ratedAt.toDate();
                    if (ratedDate >= weekStart && ratedDate <= weekEnd) {
                        return acc + rating.tip;
                    }
                }
                return acc;
            }, 0) || 0;
            
            // Re-set the weekly earnings by adding tips to the already calculated delivery earnings
            setCurrentWeekEarnings(prev => prev + weeklyTips);
        }
    }, [profile]); // Reruns when profile data (with tips) arrives

    const overallRating = useMemo(() => {
        if (!profile?.deliveryRatings) return null;
        const ratings = profile.deliveryRatings.filter(r => typeof r.rating === 'number' && r.rating > 0);
        if (ratings.length === 0) return 0;
        const total = ratings.reduce((acc, r) => acc + r.rating, 0);
        return total / ratings.length;
    }, [profile]);

    const allStats = [
        {
            title: "Current Week Earnings",
            value: isLoadingWeekEarnings ? null : currentWeekEarnings.toFixed(2),
            subtext: "Includes deliveries and tips",
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
            value: isLoadingProfile ? null : (overallRating !== null ? `${overallRating.toFixed(1)}/5` : "N/A"),
            subtext: "Your average customer rating",
            icon: Star,
            color: "text-yellow-500",
            href: "/ratings",
            isCurrency: false,
            isLoading: isLoadingProfile,
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
