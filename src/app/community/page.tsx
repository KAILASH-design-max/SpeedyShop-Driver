
"use client";

import { Announcements } from "@/components/community/Announcements";
import { TopEarnersLeaderboard } from "@/components/community/TopEarnersLeaderboard";
import { TopPerformersLeaderboard } from "@/components/community/TopPerformersLeaderboard";
import { CommunityChat } from "@/components/community/CommunityChat";
import { Users } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="space-y-6 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
           <CommunityChat />
        </div>
        <div className="space-y-6">
          <TopEarnersLeaderboard />
          <TopPerformersLeaderboard />
          <Announcements />
        </div>
      </div>
    </div>
  );
}

