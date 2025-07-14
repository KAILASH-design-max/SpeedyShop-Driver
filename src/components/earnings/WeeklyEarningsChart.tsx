
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltip, ChartTooltipContent, ChartContainer, ChartConfig } from '@/components/ui/chart';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

const chartConfig = {
  earnings: {
    label: 'Earnings',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function WeeklyEarningsChart() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chartData, setChartData] = useState<{ day: string; earnings: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      if (!auth.currentUser) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    const today = new Date();
    // Setting Monday as the first day of the week
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const weekDeliveriesQuery = query(
        collection(db, "orders"),
        where("deliveryPartnerId", "==", currentUser.uid),
        where("orderStatus", "==", "delivered"),
        where("completedAt", ">=", weekStart),
        where("completedAt", "<=", weekEnd)
    );

    const unsubscribe = onSnapshot(weekDeliveriesQuery, (snapshot) => {
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const dailyEarnings: { [key: string]: number } = {};

        weekDays.forEach(day => {
            const dayKey = format(day, 'E'); // Mon, Tue, etc.
            dailyEarnings[dayKey] = 0;
        });

        snapshot.forEach(doc => {
            const orderData = doc.data();
            const earning = orderData.estimatedEarnings ?? orderData.deliveryCharge ?? 0;
            const completedAtTimestamp = orderData.completedAt as Timestamp;
            if (completedAtTimestamp) {
                const completedDate = completedAtTimestamp.toDate();
                const dayKey = format(completedDate, 'E');
                if (dailyEarnings.hasOwnProperty(dayKey)) {
                    dailyEarnings[dayKey] += earning;
                }
            }
        });

        const formattedChartData = Object.entries(dailyEarnings).map(([day, earnings]) => ({
            day,
            earnings,
        }));
        
        // Ensure the order is Mon, Tue, Wed...
        const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        formattedChartData.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
        
        setChartData(formattedChartData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching weekly earnings for chart:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const maxEarning = chartData.length > 0 ? Math.max(...chartData.map(d => d.earnings)) : 0;
  const yAxisDomain = [0, maxEarning > 0 ? Math.ceil(maxEarning / 100) * 100 : 100]; // Round up to nearest 100

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Weekly Earnings</CardTitle>
        <CardDescription>Your earnings for the current week.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading chart data...</p>
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                />
                <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
                domain={yAxisDomain}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        indicator="dot"
                        formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value as number)}
                    />}
                />
                <Bar dataKey="earnings" fill="var(--color-earnings)" radius={4} />
            </BarChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
