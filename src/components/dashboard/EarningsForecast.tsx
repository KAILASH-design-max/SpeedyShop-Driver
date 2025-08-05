
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2, IndianRupee, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getEarningsForecast } from "@/ai/flows/get-earnings-forecast-flow";
import type { GetEarningsForecastOutput } from "@/types";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import type { User } from 'firebase/auth';
import type { Order } from "@/types";
import { format } from 'date-fns';

export function EarningsForecast() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [forecast, setForecast] = useState<GetEarningsForecastOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            if(!auth.currentUser) setLoading(false);
            return;
        }

        setLoading(true);

        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const pastDeliveriesQuery = query(
            collection(db, "orders"),
            where("deliveryPartnerId", "==", currentUser.uid),
            where("orderStatus", "==", "delivered"),
            where("completedAt", ">=", oneMonthAgo)
        );

        const unsubscribe = onSnapshot(pastDeliveriesQuery, async (snapshot) => {
            if (snapshot.empty) {
                setLoading(false);
                return;
            }

            let totalEarnings = 0;
            const deliveriesByDay: { [key: string]: number } = {};

            snapshot.forEach(doc => {
                const order = doc.data() as Order;
                totalEarnings += order.estimatedEarnings || 0;
                const completedDate = (order.completedAt as Timestamp)?.toDate();
                if (completedDate) {
                    const dayKey = format(completedDate, 'yyyy-MM-dd');
                    deliveriesByDay[dayKey] = (deliveriesByDay[dayKey] || 0) + 1;
                }
            });

            const daysWithDeliveries = Object.keys(deliveriesByDay).length;
            const averageDailyEarnings = daysWithDeliveries > 0 ? totalEarnings / daysWithDeliveries : 0;
            const totalDeliveries = snapshot.size;
            const averageDeliveriesPerDay = daysWithDeliveries > 0 ? totalDeliveries / daysWithDeliveries : 0;

            const hour = now.getHours();
            let timeOfDay = 'Afternoon';
            if (hour < 12) timeOfDay = 'Morning';
            if (hour >= 17) timeOfDay = 'Evening';
            if (hour >= 22) timeOfDay = 'Late Night';

            try {
                const forecastResult = await getEarningsForecast({
                    dayOfWeek: format(now, 'EEEE'), // e.g., "Monday"
                    timeOfDay: timeOfDay,
                    averageDailyEarnings,
                    averageDeliveriesPerDay,
                });
                setForecast(forecastResult);
            } catch (err) {
                console.error("Error fetching earnings forecast:", err);
                toast({
                    variant: "destructive",
                    title: "Forecast Error",
                    description: "Could not generate earnings forecast.",
                });
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching past deliveries for forecast:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, toast]);


    if (loading) {
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <BrainCircuit className="mr-2 text-primary h-5 w-5" />
                        Earnings Forecast
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-6">
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   <p className="ml-2 text-muted-foreground">Analyzing data...</p>
                </CardContent>
            </Card>
        );
    }
    
    if (!forecast) {
        // Don't render the card if there's no data or forecast failed
        return null;
    }

    return (
        <Card className="shadow-lg bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <BrainCircuit className="mr-2 text-primary h-5 w-5" />
                    Today's Forecast
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Potential Earnings Today</p>
                    <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                        <IndianRupee size={22}/>
                        {forecast.estimatedEarningsRange.min.toFixed(0)} - {forecast.estimatedEarningsRange.max.toFixed(0)}
                    </p>
                </div>
                <div className="flex items-start gap-2 text-sm text-primary/90">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="italic">{forecast.forecastInsight}</p>
                </div>
            </CardContent>
        </Card>
    );
}

