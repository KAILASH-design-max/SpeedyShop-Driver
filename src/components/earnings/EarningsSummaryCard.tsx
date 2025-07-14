
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, PiggyBank, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Profile } from "@/types";

export function EarningsSummaryCard() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);
    const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (!user) setIsLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
             if(!auth.currentUser) {
                setIsLoading(false);
            }
            return;
        };

        setIsLoading(true);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let totalLifetimeDeliveryEarnings = 0;
        let totalMonthDeliveryEarnings = 0;

        // Listener for all deliveries
        const allDeliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("orderStatus", "==", "delivered")
        );
        
        const unsubscribeDeliveries = onSnapshot(allDeliveriesQuery, (snapshot) => {
            totalLifetimeDeliveryEarnings = 0;
            totalMonthDeliveryEarnings = 0;

            snapshot.forEach(doc => {
                const orderData = doc.data();
                const earning = orderData.estimatedEarnings ?? orderData.deliveryCharge ?? 0;
                totalLifetimeDeliveryEarnings += earning;
                
                const completedAtTimestamp = orderData.completedAt as Timestamp;
                if (completedAtTimestamp && completedAtTimestamp.toDate() >= startOfMonth) {
                    totalMonthDeliveryEarnings += earning;
                }
            });
            // Initially set earnings without tips
            setLifetimeEarnings(totalLifetimeDeliveryEarnings);
            setMonthlyEarnings(totalMonthDeliveryEarnings);
        }, (error) => {
            console.error("Error fetching earnings summary:", error);
            setIsLoading(false);
        });

        // Listener for user profile to get tips
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profile = docSnap.data() as Profile;
                const ratings = profile.deliveryRatings || [];

                let totalLifetimeTips = 0;
                let totalMonthTips = 0;

                ratings.forEach(rating => {
                    if (rating.tip && rating.tip > 0) {
                        totalLifetimeTips += rating.tip;
                        if (rating.ratedAt?.toDate && rating.ratedAt.toDate() >= startOfMonth) {
                            totalMonthTips += rating.tip;
                        }
                    }
                });

                // Combine delivery earnings with tips
                setLifetimeEarnings(totalLifetimeDeliveryEarnings + totalLifetimeTips);
                setMonthlyEarnings(totalMonthDeliveryEarnings + totalMonthTips);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching profile for tips:", error);
            setIsLoading(false); // still stop loading on error
        });


        return () => {
            unsubscribeDeliveries();
            unsubscribeProfile();
        };
    }, [currentUser]);


    const stats = [
        {
            title: "This Month’s Earnings",
            amount: isLoading ? null : monthlyEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            description: "Includes tips",
            icon: Calendar,
            color: "text-green-500",
            href: "/earnings/history",
            isLoading: isLoading,
        },
        {
            title: "Total Lifetime Earnings",
            amount: isLoading ? null : lifetimeEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            description: "Includes tips",
            icon: PiggyBank,
            color: "text-purple-500",
            href: "/orders",
            isLoading: isLoading,
        },
    ];

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
                                {stat.isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                       ₹{stat.amount}
                                    </>
                                )}
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
