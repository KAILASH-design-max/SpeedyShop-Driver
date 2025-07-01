
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Order } from "@/types";
import { Loader2 } from "lucide-react";

export function RecentDeliveries() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [deliveries, setDeliveries] = useState<Order[]>([]);
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
            setDeliveries([]);
            return;
        }

        setLoading(true);

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const deliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("orderStatus", "==", "delivered"),
            where("completedAt", ">=", startOfToday),
            where("completedAt", "<=", endOfToday),
            orderBy("completedAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(deliveriesQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Order));
            setDeliveries(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recent deliveries:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Recent Deliveries</CardTitle>
                <CardDescription>
                    {loading ? "Loading deliveries..." : `You've completed ${deliveries.length} ${deliveries.length === 1 ? 'delivery' : 'deliveries'} today.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Loading recent deliveries...</p>
                    </div>
                ) : deliveries.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No deliveries completed today.</p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {deliveries.map((delivery) => (
                            <li key={delivery.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 bg-muted">
                                        <AvatarFallback className="text-md font-semibold bg-primary/10 text-primary">
                                            {delivery.customerName?.charAt(0).toUpperCase() || "C"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground">{delivery.customerName}</p>
                                        <p className="text-sm text-muted-foreground">Order #{delivery.id.substring(0, 6)}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-green-600 text-md">
                                    ₹{(delivery.estimatedEarnings || 0).toFixed(2)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
