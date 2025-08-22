
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Order } from '@/types';
import { MapPin, Loader2 } from "lucide-react";

export function TopEarningZones() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("status", "==", "delivered"),
            where("completedAt", ">=", thirtyDaysAgo)
        );

        const unsubscribe = onSnapshot(deliveriesQuery, (snapshot) => {
            setOrders(snapshot.docs.map(doc => doc.data() as Order));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching data for top zones:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const topZones = useMemo(() => {
        const zones: { [key: string]: { earnings: number; deliveries: number } } = {};
        
        orders.forEach(order => {
            // Extract a "zone" from the dropOffLocation. A simple way is to use the city or first part of the address.
            const locationParts = order.dropOffLocation?.split(',');
            const zoneName = locationParts && locationParts.length > 1 ? locationParts[1].trim() : "Unknown Zone";
            
            if (!zones[zoneName]) {
                zones[zoneName] = { earnings: 0, deliveries: 0 };
            }
            
            zones[zoneName].earnings += (order.estimatedEarnings || 0) + (order.tipAmount || 0);
            zones[zoneName].deliveries += 1;
        });

        return Object.entries(zones)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, 5); // Get top 5 zones

    }, [orders]);

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Top Earning Zones
                </CardTitle>
                <CardDescription>
                    Highest earning areas from the last 30 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     </div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Zone</TableHead>
                                    <TableHead className="text-right">Earnings</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topZones.length > 0 ? topZones.map((zone, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-normal">{index + 1}</Badge>
                                                <span>{zone.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            ₹{zone.earnings.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">
                                            Not enough data to show top zones.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
