
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { RecentDeliveries } from "@/components/orders/RecentDeliveries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersHistoryPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold flex items-center"><Package className="mr-2 h-6 w-6"/>Delivery History</h1>
            <p className="text-muted-foreground text-sm">View your past deliveries</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
           <RecentDeliveries />
        </CardContent>
      </Card>

    </div>
  );
}
