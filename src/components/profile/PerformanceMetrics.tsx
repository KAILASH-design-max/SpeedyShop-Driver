
"use client";

import type { Order, Profile, DeliveryRating } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Star, ThumbsUp, Loader2, Package, Percent, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "firebase/auth";

interface PerformanceMetricsProps {
  profile: Profile;
}

interface FeedbackItem {
    name: string;
    rating: number;
    comment?: string;
    timestamp: any;
    avatarFallback: string;
}

const improvementTips = [
    "Be polite and professional with customers.",
    "Double-check items before leaving the store.",
    "Keep the customer updated on your progress.",
    "Deliver on time and handle packages with care.",
];

export function PerformanceMetrics({ profile }: PerformanceMetricsProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [deliveryRatings, setDeliveryRatings] = useState<DeliveryRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
        setLoadingOrders(false);
        setLoadingRatings(false);
        return;
    }

    setLoadingOrders(true);
    setLoadingRatings(true);

    const ordersQuery = query(
        collection(db, "orders"),
        where("deliveryPartnerId", "==", currentUser.uid)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
        setLoadingOrders(false);
    }, (error) => {
        console.error("Error fetching orders for metrics:", error);
        setLoadingOrders(false);
    });
    
    const ratingsQuery = query(
        collection(db, 'deliveryPartnerRatings'),
        where('deliveryPartnerId', '==', currentUser.uid)
    );
    const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
        const fetchedRatings = snapshot.docs.map(doc => doc.data() as DeliveryRating);
        setDeliveryRatings(fetchedRatings);
        setLoadingRatings(false);
    });

    return () => {
        unsubscribeOrders();
        unsubscribeRatings();
    }
  }, [currentUser]);

  const { overallRating, ratingBreakdown, totalRatings, lifetimeTips } = useMemo(() => {
    const ratings = deliveryRatings.filter(r => typeof r.rating === 'number') || [];
    const tips = deliveryRatings.reduce((acc, r) => acc + (r.tip || 0), 0) || 0;
    
    if (ratings.length === 0) {
      return {
        overallRating: 0,
        totalRatings: 0,
        ratingBreakdown: [
          { stars: 5, count: 0, percentage: 0 },
          { stars: 4, count: 0, percentage: 0 },
          { stars: 3, count: 0, percentage: 0 },
          { stars: 2, count: 0, percentage: 0 },
          { stars: 1, count: 0, percentage: 0 },
        ],
        lifetimeTips: tips,
      };
    }
    
    const totalRatingValue = ratings.reduce((acc, r) => acc + r.rating, 0);
    const overallRatingValue = ratings.length > 0 ? totalRatingValue / ratings.length : 0;
    const overallRating = isNaN(overallRatingValue) ? 0 : overallRatingValue;


    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      const ratingKey = Math.round(r.rating);
      if (ratingKey >= 1 && ratingKey <= 5) {
        counts[ratingKey]++;
      }
    });

    const breakdown = Object.entries(counts).map(([stars, count]) => ({
      stars: parseInt(stars, 10),
      count,
      percentage: ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0,
    })).sort((a, b) => b.stars - a.stars);

    return { overallRating, ratingBreakdown: breakdown, totalRatings: ratings.length, lifetimeTips: tips };
  }, [deliveryRatings]);
  
   const performanceStats = useMemo(() => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const completionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    return {
      totalDeliveries: deliveredOrders,
      completionRate,
      lifetimeTips,
    };
  }, [orders, lifetimeTips]);
  
  useEffect(() => {
    const processFeedback = async () => {
      setLoadingFeedback(true);
      const validRatings = deliveryRatings.filter(r => typeof r.rating === 'number');
      if (validRatings.length === 0) {
        setLoadingFeedback(false);
        setFeedbackList([]);
        return;
      }
      
      const sortedRatings = [...validRatings].sort((a, b) => {
        const aHasComment = !!a.comment;
        const bHasComment = !!b.comment;
        if (aHasComment !== bHasComment) return aHasComment ? -1 : 1;
        return (b.ratedAt?.seconds ?? 0) - (a.ratedAt?.seconds ?? 0);
      }).slice(0, 5);

      const customerIds = [...new Set(sortedRatings.map(r => r.userId))];
      const customerDocs = await Promise.all(customerIds.map(id => getDoc(doc(db, "users", id))));
      const customerNames = Object.fromEntries(customerDocs.map(d => [d.id, d.data()?.name || "Customer"]));
      
      const feedbackData = sortedRatings.map(rating => {
          const name = customerNames[rating.userId] || "Customer";
          return {
            name: name,
            rating: rating.rating,
            comment: rating.comment,
            timestamp: rating.ratedAt,
            avatarFallback: name.charAt(0).toUpperCase(),
          };
      });

      setFeedbackList(feedbackData);
      setLoadingFeedback(false);
    };

    if (!loadingRatings) {
      processFeedback();
    }
  }, [deliveryRatings, loadingRatings]);
  
  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const starArray = [];
    const starSizeClass = size === 'lg' ? "h-6 w-6" : "h-4 w-4";
    for (let i = 1; i <= 5; i++) {
        starArray.push(
            <Star 
                key={i} 
                className={`${starSizeClass} ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        );
    }
    return starArray;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  }

  const StatCard = ({ title, value, icon: Icon, color, isLoading, unit }: { title: string, value: string | number, icon: React.ElementType, color: string, isLoading: boolean, unit?: string}) => (
    <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className={`text-2xl font-bold ${color}`}>
                    {value}{unit}
                </div>
            )}
        </CardContent>
    </Card>
  );

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><BarChart className="mr-2 h-6 w-6"/>Your Performance</CardTitle>
        <CardDescription>A summary of your customer ratings and delivery statistics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Performance Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Performance Stats</h3>
           <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Total Completed Deliveries"
                value={performanceStats.totalDeliveries}
                icon={Package}
                color="text-blue-500"
                isLoading={loadingOrders}
              />
              <StatCard
                title="Delivery Completion Rate"
                value={performanceStats.completionRate.toFixed(1)}
                unit="%"
                icon={Percent}
                color="text-green-500"
                isLoading={loadingOrders}
              />
              <StatCard
                title="Lifetime Tips Earned"
                value={`₹${performanceStats.lifetimeTips.toFixed(2)}`}
                icon={Gift}
                color="text-orange-500"
                isLoading={loadingRatings}
              />
           </div>
        </div>

        {/* Overall Rating */}
        <div className="text-center p-6 bg-secondary rounded-lg">
            <p className="text-muted-foreground">Overall Rating (from {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</p>
            <div className="text-5xl font-bold my-2 text-primary">{overallRating.toFixed(1)} / 5.0</div>
            <div className="flex justify-center gap-1">
                {renderStars(overallRating, 'lg')}
            </div>
        </div>

        {/* Rating Breakdown */}
        <div>
            <h3 className="text-lg font-semibold mb-3">Rating Breakdown</h3>
            <div className="space-y-3">
                {ratingBreakdown.map(item => (
                    <div key={item.stars} className="flex items-center gap-4">
                        <div className="text-sm font-medium w-16 shrink-0">{item.stars}★</div>
                        <Progress value={item.percentage} className="h-2 flex-grow bg-gray-200 [&>div]:bg-yellow-400" />
                        <span className="text-sm font-medium w-24 text-right text-muted-foreground">{item.count} {item.count === 1 ? 'rating' : 'ratings'}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Customer Feedback */}
        <div>
            <h3 className="text-lg font-semibold mb-3">Recent Customer Feedback</h3>
            {loadingFeedback ? (
              <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Loading feedback...</p>
              </div>
            ) : feedbackList.length > 0 ? (
                <div className="space-y-4">
                    {feedbackList.map((feedback, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                            <Avatar>
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">{feedback.avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{feedback.name}</p>
                                        <div className="flex">{renderStars(feedback.rating)}</div>
                                    </div>
                                </div>
                                {feedback.comment ? (
                                    <p className="text-sm text-foreground mt-1 italic">"{feedback.comment}"</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1 italic">No comment left.</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">{formatTimestamp(feedback.timestamp)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <p className="text-muted-foreground text-center p-4">No recent feedback available.</p>
            )}
        </div>
        
        {/* Tips Box */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800"><ThumbsUp className="mr-2 h-5 w-5"/>Tips to Improve Rating</h3>
            <ul className="space-y-1.5 list-disc list-inside text-sm text-blue-700">
                {improvementTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
