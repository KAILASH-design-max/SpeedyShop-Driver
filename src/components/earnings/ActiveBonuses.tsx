
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const bonuses = [
    {
        title: "Complete 10 Deliveries Today",
        reward: 100,
        progress: 6,
        target: 10,
        status: "Active",
        timeLeft: "4 hours left",
        icon: Target
    },
    {
        title: "5-Star Rating Streak",
        reward: 150,
        progress: 3,
        target: 5,
        status: "Active",
        timeLeft: "Ends this week",
        icon: Trophy
    },
    {
        title: "Weekend Warrior",
        reward: 250,
        progress: 0,
        target: 20,
        status: "Upcoming",
        timeLeft: "Starts Saturday",
        icon: Target
    }
];

const getStatusBadgeClass = (status: string) => {
    switch(status.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
        case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
        case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
        default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
}

export function ActiveBonuses() {
    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>Your Active & Upcoming Bonuses</CardTitle>
                <CardDescription>Complete challenges to earn extra.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {bonuses.map((bonus, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-muted/30 flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                           <bonus.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{bonus.title}</p>
                                    <p className="text-sm font-bold text-green-600">Reward: ₹{bonus.reward}</p>
                                </div>
                                <Badge variant="outline" className={cn("capitalize", getStatusBadgeClass(bonus.status))}>{bonus.status}</Badge>
                            </div>
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progress</span>
                                    <span>{bonus.progress} / {bonus.target} Deliveries</span>
                                </div>
                                <Progress value={(bonus.progress / bonus.target) * 100} className="h-2" />
                                <div className="flex items-center text-xs text-muted-foreground mt-2">
                                    <Clock className="h-3 w-3 mr-1.5" />
                                    <span>{bonus.timeLeft}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
