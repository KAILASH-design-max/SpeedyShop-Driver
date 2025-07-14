
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Wallet, Loader2, Star, Gift, ShoppingBag, TrendingUp, Package } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { format, getWeekOfMonth, startOfMonth } from 'date-fns';
import type { User } from 'firebase/auth';
import type { MonthlyEarning, Order } from '@/types';
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";

// Helper function to format the month string
const formatMonth = (monthStr: string) => {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy');
  } catch {
    return monthStr; // Fallback
  }
};

const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const breakdownIcons: { [key: string]: React.ElementType } = {
  week: ShoppingBag,
  bonuses: Gift,
  tips: Star,
};

const getBreakdownItemIcon = (key: string) => {
    if (key.startsWith('week')) return breakdownIcons.week;
    return breakdownIcons[key] || Wallet;
}

const formatBreakdownKey = (key: string) => {
    if (key.startsWith('week')) {
        const weekNum = key.replace('week', '');
        return `Week ${weekNum}`;
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
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
    
    const deliveriesQuery = query(
      collection(db, "orders"),
      where("deliveryPartnerId", "==", currentUser.uid),
      where("orderStatus", "==", "delivered")
    );

    const unsubscribe = onSnapshot(deliveriesQuery, async (snapshot) => {
        if (snapshot.empty) {
            setMonthlyEarnings([]);
            setLoading(false);
            return;
        }

        const ordersPromises = snapshot.docs.map(doc => mapFirestoreDocToOrder(doc));
        const allOrders = await Promise.all(ordersPromises);

        const earningsByMonth: { [key: string]: MonthlyEarning } = {};

        allOrders.forEach(order => {
            if (!order.completedAt?.toDate) return;

            const completedDate = order.completedAt.toDate();
            const monthKey = format(completedDate, 'yyyy-MM');
            const earning = order.estimatedEarnings || 0;

            if (!earningsByMonth[monthKey]) {
                earningsByMonth[monthKey] = {
                    id: monthKey,
                    month: monthKey,
                    total: 0,
                    breakdown: {},
                };
            }

            // Add to total for the month
            earningsByMonth[monthKey].total += earning;

            // Add to weekly breakdown
            const weekOfMonth = getWeekOfMonth(completedDate, { weekStartsOn: 1 });
            const weekKey = `week${weekOfMonth}`;
            
            if (!earningsByMonth[monthKey].breakdown[weekKey]) {
                earningsByMonth[monthKey].breakdown[weekKey] = 0;
            }
            earningsByMonth[monthKey].breakdown[weekKey] += earning;
        });

        const sortedEarnings = Object.values(earningsByMonth).sort((a, b) => b.month.localeCompare(a.month));

        setMonthlyEarnings(sortedEarnings);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching delivery history for earnings:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary">
          <TrendingUp className="mr-3 h-6 w-6" />
          Monthly Earnings History
        </CardTitle>
        <CardDescription>
          Track your monthly income trends and compare past performance.
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
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="font-semibold">No earnings history found.</p>
                <p className="text-sm mt-1">Your earnings will appear here after you complete deliveries.</p>
             </div>
        ) : (
            <Accordion type="single" collapsible className="w-full">
                {monthlyEarnings.map((item) => (
                    <AccordionItem value={item.id} key={item.id}>
                        <AccordionTrigger className="hover:no-underline">
                           <div className="flex items-center justify-between w-full pr-4">
                             <div className="flex items-center">
                                 <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                                 <p className="font-semibold">{formatMonth(item.month)}</p>
                             </div>
                             <p className="font-bold text-lg text-green-600">{formatCurrency(item.total)}</p>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="p-4 bg-muted/30 rounded-md">
                             <h4 className="font-semibold mb-3 text-sm">Weekly Breakdown:</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {Object.entries(item.breakdown).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, value]) => {
                                   const Icon = getBreakdownItemIcon(key);
                                   return (
                                        <div key={key} className="flex items-center">
                                            <Icon className="h-4 w-4 mr-2 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">{formatBreakdownKey(key)}</p>
                                                <p className="font-semibold">{formatCurrency(value)}</p>
                                            </div>
                                        </div>
                                   );
                                })}
                             </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
