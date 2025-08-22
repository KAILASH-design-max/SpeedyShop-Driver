
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IndianRupee, Loader2, Trophy } from "lucide-react";
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import type { Order, Profile } from '@/types';
import { startOfWeek, endOfWeek } from 'date-fns';

interface LeaderboardEntry {
  uid: string;
  name: string;
  profilePictureUrl?: string;
  value: number;
}

export function TopEarnersLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const deliveriesQuery = query(
      collection(db, "orders"),
      where("status", "==", "delivered"),
      where("completedAt", ">=", weekStart),
      where("completedAt", "<=", weekEnd)
    );

    const unsubscribe = onSnapshot(deliveriesQuery, async (snapshot) => {
      const earningsMap: { [key: string]: number } = {};

      snapshot.forEach(doc => {
        const order = doc.data() as Order;
        if (order.deliveryPartnerId) {
          const earning = (order.estimatedEarnings || 0) + (order.tipAmount || 0);
          earningsMap[order.deliveryPartnerId] = (earningsMap[order.deliveryPartnerId] || 0) + earning;
        }
      });
      
      const userIds = Object.keys(earningsMap);
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

      const leaderboardData = Object.entries(earningsMap)
        .map(([uid, totalEarnings]) => ({
          uid,
          name: usersData[uid]?.name || "Unknown Driver",
          profilePictureUrl: usersData[uid]?.profilePictureUrl,
          value: totalEarnings,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setLeaderboard(leaderboardData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching top earners:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Weekly Top Earners
        </CardTitle>
        <CardDescription>Top 5 earners for this week.</CardDescription>
      </CardHeader>
      <CardContent>
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
                <div className="font-bold text-green-600 flex items-center">
                  <IndianRupee size={16} className="mr-0.5" />
                  {entry.value.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground h-48 flex items-center justify-center">
            No earnings recorded this week. Be the first!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
