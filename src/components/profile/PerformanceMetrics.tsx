
"use client";

import type { Profile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Clock, Percent, ListChecks, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PerformanceMetricsProps {
  profile: Profile;
}

interface MetricDisplayProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    progressValue?: number; // 0-100 for progress bar
}

function MetricDisplay({ label, value, unit, icon: Icon, progressValue }: MetricDisplayProps) {
    return (
        <div className="p-4 border rounded-lg bg-background shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                </span>
                <span className="text-lg font-semibold text-primary">{value}{unit && <span className="text-xs">{unit}</span>}</span>
            </div>
            {progressValue !== undefined && <Progress value={progressValue} className="h-2" />}
        </div>
    );
}


export function PerformanceMetrics({ profile }: PerformanceMetricsProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary"><TrendingUp className="mr-2 h-6 w-6"/>Performance Metrics</CardTitle>
        <CardDescription>Overview of your delivery performance.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricDisplay 
            label="Average Delivery Time" 
            value={profile.averageDeliveryTime}
            unit=" mins"
            icon={Clock}
        />
        <MetricDisplay 
            label="On-Time Delivery Rate" 
            value={profile.onTimeDeliveryRate}
            unit="%"
            icon={Percent}
            progressValue={profile.onTimeDeliveryRate}
        />
        <MetricDisplay 
            label="Total Deliveries Completed" 
            value={profile.totalDeliveries}
            icon={ListChecks}
        />
         <MetricDisplay 
            label="Customer Rating" 
            value={profile.overallRating || "N/A"} // Assuming overallRating is part of Profile, add if not
            unit={profile.overallRating ? "/5" : ""}
            icon={Star} // Add Star if not imported
            progressValue={profile.overallRating ? (profile.overallRating / 5) * 100 : 0}
        />
      </CardContent>
    </Card>
  );
}

// Assuming Star is used, let's add it if missing from lucide-react imports elsewhere
import { Star } from "lucide-react";
