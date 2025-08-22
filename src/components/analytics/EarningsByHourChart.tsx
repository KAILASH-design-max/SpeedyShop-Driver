
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltip, ChartTooltipContent, ChartContainer, ChartConfig } from '@/components/ui/chart';
import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Order } from '@/types';
import { Loader2 } from 'lucide-react';

const chartConfig = {
  earnings: {
    label: 'Earnings',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


export function EarningsByHourChart() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [chartData, setChartData] = useState<{ hour: string; earnings: number }[]>([]);
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
            const hourlyEarnings: { [key: number]: number } = {};
            for (let i = 0; i < 24; i++) {
                hourlyEarnings[i] = 0;
            }

            snapshot.forEach(doc => {
                const order = doc.data() as Order;
                const earning = (order.estimatedEarnings || 0) + (order.tipAmount || 0);
                const completedAt = (order.completedAt as Timestamp)?.toDate();
                if (completedAt) {
                    const hour = completedAt.getHours();
                    hourlyEarnings[hour] += earning;
                }
            });

            const formattedChartData = Object.entries(hourlyEarnings).map(([hour, earnings]) => ({
                hour: `${parseInt(hour, 10).toString().padStart(2, '0')}:00`,
                earnings,
            }));

            setChartData(formattedChartData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching data for hourly chart:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    
    const maxEarning = chartData.length > 0 ? Math.max(...chartData.map(d => d.earnings)) : 0;
    const yAxisDomain = [0, maxEarning > 0 ? Math.ceil(maxEarning / 100) * 100 : 100];

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>Earnings by Hour of Day</CardTitle>
                <CardDescription>Average earnings based on your delivery history from the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Analyzing earnings data...</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="hour"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
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
