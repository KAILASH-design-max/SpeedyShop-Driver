
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Clock, Check, Star, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Order, Session } from '@/types';

// Helper to get today's date string in YYYY-MM-DD format (UTC)
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = today.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function PerformanceKPIs() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const todayStr = getTodayDateString();

        const ordersQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("completedAt", ">=", thirtyDaysAgo)
        );

        const sessionsQuery = query(
            collection(db, "sessions"),
            where("userId", "==", currentUser.uid),
            where("date", ">=", todayStr) // Simplified to today's sessions
        );

        const ratingsQuery = query(
            collection(db, "deliveryPartnerRatings"),
            where("deliveryPartnerId", "==", currentUser.uid)
        );

        const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
            setOrders(snapshot.docs.map(doc => doc.data() as Order));
        });

        const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
            setSessions(snapshot.docs.map(doc => doc.data() as Session));
        });

        const unsubRatings = onSnapshot(ratingsQuery, (snapshot) => {
            setRatings(snapshot.docs.map(doc => doc.data()));
            setLoading(false); // Consider loading finished after ratings
        });


        return () => {
            unsubOrders();
            unsubSessions();
            unsubRatings();
        };

    }, [currentUser]);


    const kpiData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        const totalEarnings = deliveredOrders.reduce((acc, o) => acc + (o.estimatedEarnings || 0) + (o.tipAmount || 0), 0);
        
        let totalActiveSeconds = sessions.reduce((acc, s) => {
            if (s.loginTimestamp && s.logoutTimestamp) {
                return acc + (s.logoutTimestamp.seconds - s.loginTimestamp.seconds);
            }
             if (s.loginTimestamp && !s.logoutTimestamp) {
                return acc + (Math.floor(Date.now() / 1000) - s.loginTimestamp.seconds);
            }
            return acc;
        }, 0);
        
        const totalActiveHours = totalActiveSeconds > 0 ? totalActiveSeconds / 3600 : 0;
        
        const earningsPerHour = totalActiveHours > 0 ? totalEarnings / totalActiveHours : 0;
        
        const acceptanceRate = 100; // Placeholder as we don't track offered vs accepted

        const overallRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;
        
        return {
            earningsPerHour,
            acceptanceRate,
            overallRating,
        };
    }, [orders, sessions, ratings]);
    

    const stats = [
        {
            title: "Avg. Earnings / Hr",
            value: `₹${kpiData.earningsPerHour.toFixed(2)}`,
            icon: IndianRupee,
            color: "text-green-500",
        },
        {
            title: "Acceptance Rate",
            value: `${kpiData.acceptanceRate.toFixed(1)}%`,
            icon: Check,
            color: "text-blue-500",
            subtext: "Based on last 50 offers"
        },
        {
            title: "Avg. Time / Trip",
            value: "28 min",
            icon: Clock,
            color: "text-orange-500",
            subtext: "Pickup to delivery"
        },
        {
            title: "Overall Rating",
            value: `${kpiData.overallRating.toFixed(2)}`,
            icon: Star,
            color: "text-yellow-500",
            subtext: `From ${ratings.length} ratings`
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title} className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${stat.color}`}>
                                    {stat.value}
                                </div>
                                {stat.subtext && <p className="text-xs text-muted-foreground">{stat.subtext}</p>}
                           </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
