
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RecentDeliveries } from "@/components/orders/RecentDeliveries";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrdersHistoryPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 px-1 pb-6">
      <Button variant="outline" onClick={() => router.push('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="shadow-lg">
        <CardContent className="p-6">
           <RecentDeliveries />
        </CardContent>
      </Card>

    </div>
  );
}
