
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MonthlyEarningsHistory } from "@/components/earnings/MonthlyEarningsHistory";

export default function MonthlyEarningsHistoryPage() {
  const router = useRouter();

  return (
    <div className="md:p-6 space-y-6">
      <MonthlyEarningsHistory />
    </div>
  );
}
