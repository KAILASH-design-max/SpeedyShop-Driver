
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MonthlyEarningsHistory } from "@/components/earnings/MonthlyEarningsHistory";

export default function MonthlyEarningsHistoryPage() {
  const router = useRouter();

  return (
    <div className="md:p-6 space-y-6">
      <div className="p-4 md:p-0">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <MonthlyEarningsHistory />
    </div>
  );
}
