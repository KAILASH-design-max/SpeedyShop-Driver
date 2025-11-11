
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Truck, Loader2, Star } from "lucide-react";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import type { Order, Profile } from '@/types';
import { subDays, startOfToday } from 'date-fns';

interface LeaderboardEntry {
  uid: string;
  name: string;
  profilePictureUrl?: string;
  value: number;
}

export function TopPerformersLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const sevenDaysAgo = subDays(startOfToday(), 7);

    const deliveriesQuery = query(
      collection(db, "orders"),
      where("status", "==", "delivered"),
      where("completedAt", ">=", sevenDaysAgo)
    );

    const unsubscribe = onSnapshot(deliveriesQuery, async (snapshot) => {
      const deliveriesMap: { [key: string]: number } = {};

      snapshot.forEach(doc => {
        const order = doc.data() as Order;
        if (order.deliveryPartnerId) {
          deliveriesMap[order.deliveryPartnerId] = (deliveriesMap[order.deliveryPartnerId] || 0) + 1;
        }
      });
      
      const userIds = Object.keys(deliveriesMap);
       if (userIds.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }
      
      const usersQuery = query(collection(db, "users"), where("uid", "in", userIds));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: { [key: string]: Profile } = {};
      usersSnapshot.forEach(doc => {
          usersData[doc.id] = doc.data() as Profile;
      });

      const leaderboardData = Object.entries(deliveriesMap)
        .map(([uid, totalDeliveries]) => ({
          uid,
          name: usersData[uid]?.name || "Unknown Driver",
          profilePictureUrl: usersData[uid]?.profilePictureUrl,
          value: totalDeliveries,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setLeaderboard(leaderboardData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching top performers:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card className="shadow-none md:shadow-xl rounded-none md:rounded-lg border-x-0 md:border">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="flex items-center">
          <Truck className="mr-2 h-5 w-5 text-blue-500" />
          Top Performers
        </CardTitle>
        <CardDescription>Most deliveries in the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div key={entry.uid} className="flex items-center gap-4">
                <Badge variant="secondary" className="font-bold text-lg">{index + 1}</Badge>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.profilePictureUrl} alt={entry.name} />
                  <AvatarFallback>{entry.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold truncate">{entry.name}</p>
                </div>
                <div className="font-bold text-blue-600 flex items-center">
                  {entry.value}
                  <span className="text-sm font-medium text-muted-foreground ml-1">deliveries</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground h-48 flex items-center justify-center">
            No deliveries recorded in the last 7 days.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
