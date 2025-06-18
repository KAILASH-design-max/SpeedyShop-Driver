
"use client";

import type { EarningSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Award, Star } from "lucide-react";

// Using a generic currency icon for now, replace with a specific Rupee icon if available/desired
const CurrencyIcon = () => <span className="font-semibold">₹</span>;


interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  colorClass?: string;
  prefixValue?: React.ReactNode;
}

function StatCard({ title, value, icon: Icon, description, colorClass = "text-primary", prefixValue }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
            {prefixValue}{value}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}


interface EarningsSummaryCardProps {
  summary: EarningSummary;
}

export function EarningsSummaryCard({ summary }: EarningsSummaryCardProps) {
  return (
    <Card className="shadow-xl w-full">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Earnings Overview</CardTitle>
            <CardDescription>Your performance and earnings at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Current Week Earnings" 
                    prefixValue={<CurrencyIcon />}
                    value={summary.currentWeekEarnings.toFixed(2)}
                    icon={CurrencyIcon} // Using the same icon for visual consistency, could be DollarSign
                    description="Total earnings this week"
                    colorClass="text-green-500"
                />
                <StatCard 
                    title="Deliveries Today" 
                    value={summary.completedDeliveriesToday}
                    icon={Truck}
                    description="Completed orders today"
                    colorClass="text-blue-500"
                />
                <StatCard 
                    title="Active Bonuses" 
                    value={summary.activeBonuses}
                    icon={Award}
                    description="Bonuses you're working towards"
                    colorClass="text-orange-500"
                />
                <StatCard 
                    title="Overall Rating" 
                    value={`${summary.overallRating}/5`}
                    icon={Star}
                    description="Your average customer rating"
                    colorClass="text-yellow-500"
                />
            </div>
        </CardContent>
    </Card>
  );
}
