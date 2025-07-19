"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AchievementsList } from "@/components/achievements/AchievementsList";

export default function AchievementsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <AchievementsList />
    </div>
  );
}
