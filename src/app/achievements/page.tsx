
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, Trophy } from "lucide-react";
import { AchievementsList } from "@/components/achievements/AchievementsList";
import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, orderBy } from "firebase/firestore";
import type { Order, Profile, DeliveryRating } from "@/types";
import { getAchievements, Achievement } from "@/ai/flows/get-achievements-flow";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { startOfWeek, startOfDay, endOfDay, getDay, subDays } from 'date-fns';
import { auth, db } from "@/lib/firebase";

export default function AchievementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
      
      const deliveredOrdersQuery = query(
        collection(db, "orders"),
        where("deliveryPartnerId", "==", currentUser.uid),
        where("status", "==", "delivered")
      );
      
      const ratingsQuery = query(
        collection(db, "deliveryPartnerRatings"),
        where("deliveryPartnerId", "==", currentUser.uid),
        orderBy("ratedAt", "desc")
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
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lateNightDeliveries = allOrders.filter(o => {
        const completedDate = o.completedAt?.toDate();
        return completedDate && completedDate >= monthStart && completedDate.getHours() >= 22;
      }).length;
      
      const dayOfWeek = getDay(now); // 0 = Sunday, 6 = Saturday
      const daysSinceSunday = dayOfWeek;
      const lastSunday = subDays(now, daysSinceSunday);
      const lastSaturday = subDays(lastSunday, 1);
      
      const weekendDeliveries = allOrders.filter(o => {
        const completedDate = o.completedAt?.toDate();
        if (!completedDate) return false;
        
        const completedDay = getDay(completedDate);
        const isSaturday = completedDay === 6;
        const isSunday = completedDay === 0;

        // Check if the delivery was on the most recent Saturday or Sunday
        return (isSaturday && completedDate >= startOfDay(lastSaturday) && completedDate <= endOfDay(lastSaturday)) || 
               (isSunday && completedDate >= startOfDay(lastSunday) && completedDate <= endOfDay(lastSunday));
      }).length;
      
      const overallRating = ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length) : 0;
      
      let fiveStarRatingStreak = 0;
      for (const rating of ratings) {
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
        overallRating: overallRating || 0,
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

    if (achievements.length === 0 && !loading) {
      return (
        <Card className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground border-border">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="font-semibold text-lg">No Challenges Available</p>
          <p className="text-sm mt-1">Complete some deliveries to unlock your first set of achievements!</p>
        </Card>
      );
    }

    return <AchievementsList achievements={achievements} />;
  }

  return (
    <div className="p-6 space-y-6">
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
