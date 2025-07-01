
"use client";

import type { Profile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Star, ThumbsUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PerformanceMetricsProps {
  profile: Profile;
}

const ratingBreakdown = [
    { stars: 5, percentage: 78 },
    { stars: 4, percentage: 15 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 1 },
];

const customerFeedback = [
    { name: "Amit S.", rating: 5, comment: "Delivered safely and on time. Very professional." },
    { name: "Priya K.", rating: 5, comment: "Quick delivery and polite!" },
    { name: "Rohan M.", rating: 4, comment: "Good service." },
];

const improvementTips = [
    "Be polite and professional with customers.",
    "Double-check items before leaving the store.",
    "Keep the customer updated on your progress.",
    "Deliver on time and handle packages with care.",
];

export function PerformanceMetrics({ profile }: PerformanceMetricsProps) {
  const overallRating = profile.overallRating || 0;
  
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

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><BarChart className="mr-2 h-6 w-6"/>Your Rating Summary</CardTitle>
        <CardDescription>An overview of your customer ratings and feedback.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Overall Rating */}
        <div className="text-center p-6 bg-primary/5 rounded-lg">
            <p className="text-muted-foreground">Overall Rating</p>
            <div className="text-5xl font-bold my-2 text-primary">{overallRating.toFixed(1)} / 5</div>
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
                        <div className="flex items-center text-sm w-12 shrink-0">
                            <span>{item.stars}</span>
                            <Star className="h-4 w-4 ml-1 text-yellow-400" />
                        </div>
                        <Progress value={item.percentage} className="h-2 flex-grow" />
                        <span className="text-sm font-medium w-8 text-right">{item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Customer Feedback */}
        <div>
            <h3 className="text-lg font-semibold mb-3">Recent Customer Feedback</h3>
            <div className="space-y-4">
                {customerFeedback.map((feedback, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                        <Avatar>
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">{feedback.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{feedback.name}</p>
                                <div className="flex">{renderStars(feedback.rating)}</div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">"{feedback.comment}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Tips Box */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center text-blue-800"><ThumbsUp className="mr-2 h-5 w-5"/>Tips to Improve Your Rating</h3>
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
