
"use client";

import { Announcements } from "@/components/community/Announcements";
import { TopEarnersLeaderboard } from "@/components/community/TopEarnersLeaderboard";
import { TopPerformersLeaderboard } from "@/components/community/TopPerformersLeaderboard";
import { CommunityChat } from "@/components/community/CommunityChat";
import { BarChart, Trophy, Megaphone } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center">
            <Trophy className="mr-3 h-8 w-8"/>
            Community Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect with other drivers, check leaderboards, and stay updated.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
           <CommunityChat />
           <Announcements />
        </div>
        <div className="space-y-6">
          <TopEarnersLeaderboard />
          <TopPerformersLeaderboard />
        </div>
      </div>
    </div>
  );
}
