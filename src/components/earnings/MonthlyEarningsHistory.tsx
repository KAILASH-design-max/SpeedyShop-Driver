
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Wallet, Loader2, Star, Gift, ShoppingBag, TrendingUp } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import type { User } from 'firebase/auth';
import type { MonthlyEarning } from '@/types';

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
    
    // As per your request, this now queries the user-specific subcollection.
    // Note: This collection must be populated by a backend process (e.g., a Cloud Function).
    const historyQuery = query(
        collection(db, `users/${currentUser.uid}/monthlyEarnings`),
        orderBy("month", "desc")
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
        if (snapshot.empty) {
            setMonthlyEarnings([]);
            setLoading(false);
            return;
        }

        const earningsData = snapshot.docs.map(doc => ({
            id: doc.id,
            month: doc.data().month,
            total: doc.data().total,
            breakdown: doc.data().breakdown || {},
            createdAt: doc.data().createdAt,
        } as MonthlyEarning));

        setMonthlyEarnings(earningsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching monthly earnings history:", error);
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
                <p>No monthly earnings history found.</p>
                <p className="text-xs mt-2">(This data is typically calculated and stored at the end of each month by a backend process)</p>
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
                             <h4 className="font-semibold mb-3 text-sm">Earnings Breakdown:</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {Object.entries(item.breakdown).map(([key, value]) => {
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
