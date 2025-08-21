
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, TrendingUp, Package } from "lucide-react";
import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { isSameDay } from 'date-fns';
import type { User } from 'firebase/auth';
import type { Order, DeliveryRating, Transaction } from '@/types';
import { PayoutHistoryTable } from "./PayoutHistoryTable";

export function MonthlyEarningsHistory() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allDeliveries, setAllDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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
    
    const deliveriesQuery = query(
        collection(db, "orders"),
        where("deliveryPartnerId", "==", currentUser.uid),
        where("status", "==", "delivered"),
        orderBy("completedAt", "desc")
    );
    const unsubscribeDeliveries = onSnapshot(deliveriesQuery, (snapshot) => {
        const deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setAllDeliveries(deliveries);
        setLoading(false);
    });

    return () => {
        unsubscribeDeliveries();
    };

  }, [currentUser]);

  const { deliveriesForSelectedDay, transactionsForSelectedDay } = useMemo(() => {
    if (!selectedDate) {
      return { deliveriesForSelectedDay: [], transactionsForSelectedDay: [] };
    }
    
    const deliveries = allDeliveries.filter(d => 
        d.completedAt?.toDate && isSameDay(d.completedAt.toDate(), selectedDate)
    );

    const transactions: Transaction[] = deliveries.flatMap(d => {
        const txs: Transaction[] = [];
        txs.push({
            title: `Delivery for #${d.id.substring(0, 6)}`,
            transactionId: d.id,
            type: 'Delivery',
            amount: d.estimatedEarnings || 0,
        });

        if (d.tipAmount && d.tipAmount > 0) {
            txs.push({
                title: `Tip for #${d.id.substring(0, 6)}`,
                transactionId: `${d.id}-tip`,
                type: 'Tip',
                amount: d.tipAmount,
            });
        }
        return txs;
    });
    
    return { deliveriesForSelectedDay: deliveries, transactionsForSelectedDay: transactions };
  }, [selectedDate, allDeliveries]);

  const daysWithDeliveries = useMemo(() => {
    return allDeliveries.map(d => d.completedAt.toDate());
  }, [allDeliveries]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary">
          <TrendingUp className="mr-3 h-6 w-6" />
          Daily Earnings History
        </CardTitle>
        <CardDescription>
          Select a day to view a detailed breakdown of your earnings from deliveries and tips.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading history...</p>
             </div>
        ) : allDeliveries.length === 0 ? (
             <div className="text-center text-muted-foreground p-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="font-semibold">No earnings history found.</p>
                <p className="text-sm mt-1">Your earnings will appear here after you complete deliveries.</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        disabled={(date) => date > new Date()}
                        modifiers={{ delivered: daysWithDeliveries }}
                        modifiersStyles={{ delivered: { fontWeight: 'bold', color: 'var(--primary)' } }}
                    />
                </div>
                <div className="md:col-span-2">
                    <PayoutHistoryTable 
                        transactions={transactionsForSelectedDay} 
                        deliveries={deliveriesForSelectedDay} 
                    />
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
