
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { AchievementsList } from "@/components/achievements/AchievementsList";
import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import type { Order, Profile, DeliveryRating } from "@/types";
import { getAchievements, Achievement } from "@/ai/flows/get-achievements-flow";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { startOfWeek, startOfDay, endOfDay, previousSaturday, previousSunday } from 'date-fns';

export default function AchievementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAchievements();
    } else if (auth.currentUser === null) {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchAchievements = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    try {
      // --- Fetch all necessary data in parallel ---
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const lastWeekendStart = previousSaturday(now);
      const lastWeekendEnd = previousSunday(now);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);


      const deliveredOrdersQuery = query(
        collection(db, "orders"),
        where("deliveryPartnerId", "==", currentUser.uid),
        where("status", "==", "delivered")
      );
      
      const ratingsQuery = query(
        collection(db, "deliveryPartnerRatings"),
        where("deliveryPartnerId", "==", currentUser.uid)
      );

      const [ordersSnapshot, ratingsSnapshot] = await Promise.all([
        getDocs(deliveredOrdersQuery),
        getDocs(ratingsQuery)
      ]);
      
      const allOrders = ordersSnapshot.docs.map(doc => doc.data() as Order);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data() as DeliveryRating);

      // --- Process the data ---
      const totalDeliveries = allOrders.length;
      const deliveriesToday = allOrders.filter(o => o.completedAt?.toDate() >= todayStart && o.completedAt?.toDate() <= todayEnd).length;
      const peakHourDeliveries = allOrders.filter(o => {
        const date = o.completedAt?.toDate();
        if (date && date >= weekStart) {
          const hour = date.getHours();
          return hour >= 17 && hour < 21; // 5 PM to 9 PM
        }
        return false;
      }).length;
      const weekendDeliveries = allOrders.filter(o => o.completedAt?.toDate() >= lastWeekendStart && o.completedAt?.toDate() <= lastWeekendEnd).length;
      const lateNightDeliveries = allOrders.filter(o => o.completedAt?.toDate() >= monthStart && o.completedAt?.toDate().getHours() >= 22).length;

      const overallRating = ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) : 0;
      
      let fiveStarRatingStreak = 0;
      // Sort ratings from most recent to oldest to calculate the current streak.
      const sortedRatings = ratings.sort((a,b) => b.ratedAt.seconds - a.ratedAt.seconds);
      for (const rating of sortedRatings) {
          if (rating.rating === 5) {
              fiveStarRatingStreak++;
          } else {
              break; // Streak is broken
          }
      }

      // --- Call the AI Flow ---
      const achievementInput = {
        totalDeliveries,
        deliveriesToday,
        peakHourDeliveries,
        weekendDeliveries,
        lateNightDeliveries,
        overallRating,
        fiveStarRatingStreak,
      };

      const result = await getAchievements(achievementInput);
      setAchievements(result.achievements);

    } catch (err) {
      console.error("Error fetching or generating achievements:", err);
      setError("Could not load achievements. Please try again later.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load achievements data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Generating personalized achievements...</p>
        </div>
      );
    }

    if (error) {
       return (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Achievements</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={fetchAchievements} className="mt-4">Retry</Button>
          </AlertDescription>
        </Alert>
       )
    }

    return <AchievementsList achievements={achievements} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="ghost" onClick={fetchAchievements} disabled={loading}>
            <Loader2 className={loading ? "mr-2 h-4 w-4 animate-spin" : "hidden"}/>
            Refresh
        </Button>
       </div>
      {renderContent()}
    </div>
  );
}
