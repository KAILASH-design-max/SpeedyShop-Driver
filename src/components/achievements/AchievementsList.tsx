"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Zap, Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/ai/flows/get-achievements-flow";

interface AchievementsListProps {
    achievements: Achievement[];
}

const iconMap = {
    Target,
    Trophy,
    Zap,
    Star,
    Lock
}

const getStatusBadgeClass = (status: string) => {
    switch(status.toLowerCase()) {
        case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
        case 'completed': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
        case 'locked': return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export function AchievementsList({ achievements }: AchievementsListProps) {
    return (
        <div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Your Achievements</h1>
              <p className="text-muted-foreground mt-1">Track challenges to earn extra rewards and badges.</p>
            </div>
            
            <div className="mt-6 space-y-4">
                {achievements.map((item, index) => {
                    const Icon = iconMap[item.icon] || Target;
                    return (
                        <Card key={index} className={cn("shadow-md hover:shadow-lg transition-shadow", item.status === 'Locked' && "bg-muted/50")}>
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className={cn("p-3 rounded-full mt-1 shrink-0", item.status === 'Completed' ? "bg-green-100" : "bg-primary/10")}>
                                <Icon className={cn("h-6 w-6", item.status === 'Completed' ? "text-green-600" : "text-primary")} />
                                </div>
                                <div className="flex-grow w-full">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <div className="mb-2 sm:mb-0">
                                            <p className="text-lg font-semibold">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("capitalize shrink-0", getStatusBadgeClass(item.status))}>{item.status}</Badge>
                                    </div>
                                    <div className="mt-3">
                                        {item.status !== 'Locked' && (
                                        <>
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Progress: {item.progress} / {item.target}</span>
                                                <span>Reward: <span className="font-semibold text-green-600">{item.reward}</span></span>
                                            </div>
                                            <Progress value={(item.progress / item.target) * 100} className="h-2" />
                                        </>
                                        )}
                                        {item.status === 'Locked' && (
                                        <p className="text-xs text-muted-foreground">Complete other achievements to unlock this challenge.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
