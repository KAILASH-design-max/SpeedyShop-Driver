
"use client";

import type { Profile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Star, ThumbsUp, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PerformanceMetricsProps {
  profile: Profile;
}

interface FeedbackItem {
    name: string;
    rating: number;
    comment?: string;
    timestamp: any;
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

  const { overallRating, ratingBreakdown, totalRatings } = useMemo(() => {
    const ratings = profile.deliveryRatings?.filter(r => typeof r.rating === 'number') || [];
    
    if (!ratings || ratings.length === 0) {
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
      };
    }
    
    const totalRatingValue = ratings.reduce((acc, r) => acc + r.rating, 0);
    const overallRating = totalRatingValue / ratings.length;

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

    return { overallRating, ratingBreakdown: breakdown, totalRatings: ratings.length };
  }, [profile.deliveryRatings]);
  
  useEffect(() => {
    const processFeedback = () => {
      setLoadingFeedback(true);
      const validRatings = profile.deliveryRatings?.filter(r => typeof r.rating === 'number') || [];
      if (validRatings.length === 0) {
        setLoadingFeedback(false);
        setFeedbackList([]);
        return;
      }
      
      const sortedRatings = [...validRatings].sort((a, b) => {
        const aHasComment = !!a.comment;
        const bHasComment = !!b.comment;
        if (aHasComment !== bHasComment) {
          return aHasComment ? -1 : 1;
        }
        if (!a.ratedAt || !b.ratedAt) return 0;
        return b.ratedAt.seconds - a.ratedAt.seconds;
      });

      const recentRatings = sortedRatings.slice(0, 3);

      const feedbackData = recentRatings.map(rating => ({
        name: "A Customer", // Defaulting name to simplify and prevent fetch failures
        rating: rating.rating,
        comment: rating.comment,
        timestamp: rating.ratedAt,
      }));

      setFeedbackList(feedbackData);
      setLoadingFeedback(false);
    };

    processFeedback();
  }, [profile.deliveryRatings]);
  
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

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><BarChart className="mr-2 h-6 w-6"/>Your Rating</CardTitle>
        <CardDescription>Based on your last {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Overall Rating */}
        <div className="text-center p-6 bg-primary/5 rounded-lg">
            <p className="text-muted-foreground">Overall Rating</p>
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
                                <AvatarFallback className="bg-primary/20 text-primary font-semibold">{feedback.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
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
