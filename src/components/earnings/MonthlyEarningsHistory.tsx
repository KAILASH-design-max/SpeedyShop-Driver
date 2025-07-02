
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Wallet, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import type { User } from 'firebase/auth';
import type { Order } from '@/types';
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";

interface MonthlyEarning {
    month: string;
    earnings: string;
}

export function MonthlyEarningsHistory() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
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
        setMonthlyEarnings([]);
        return;
    }

    setLoading(true);

    const historyQuery = query(
        collection(db, "orders"),
        where("deliveryPartnerId", "==", currentUser.uid),
        where("orderStatus", "==", "delivered"),
        orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(historyQuery, async (snapshot) => {
        if (snapshot.empty) {
            setMonthlyEarnings([]);
            setLoading(false);
            return;
        }

        const ordersDataPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        const orders: Order[] = await Promise.all(ordersDataPromises);
        
        const earningsByMonth: { [key: string]: number } = {};

        orders.forEach(order => {
            if (order.completedAt && order.completedAt.toDate) {
                const date = order.completedAt.toDate();
                const monthKey = format(date, 'yyyy-MM'); // e.g., "2025-07"
                const earning = order.estimatedEarnings || 0;
                
                if (earningsByMonth[monthKey]) {
                    earningsByMonth[monthKey] += earning;
                } else {
                    earningsByMonth[monthKey] = earning;
                }
            }
        });

        const formattedEarnings = Object.entries(earningsByMonth).map(([monthKey, total]) => {
            const [year, month] = monthKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                month: format(date, 'MMMM yyyy'), // "July 2025"
                earnings: total.toFixed(2),
            };
        });
        
        formattedEarnings.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

        setMonthlyEarnings(formattedEarnings);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching earnings history:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary">
          <Calendar className="mr-3 h-6 w-6" />
          Monthly Earnings History
        </CardTitle>
        <CardDescription>
          A summary of your earnings from previous months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading history...</p>
             </div>
        ) : monthlyEarnings.length === 0 ? (
             <div className="text-center text-muted-foreground p-8">
                <p>No earnings history found.</p>
             </div>
        ) : (
            <div className="space-y-4">
            {monthlyEarnings.map((item, index) => (
                <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
                >
                <div className="flex items-center">
                    <Wallet className="mr-3 h-5 w-5 text-muted-foreground" />
                    <p className="font-semibold">{item.month}</p>
                </div>
                <p className="font-bold text-lg text-green-600">₹{parseFloat(item.earnings).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
