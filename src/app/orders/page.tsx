
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { RecentDeliveries } from "@/components/orders/RecentDeliveries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function OrdersHeader() {
    const router = useRouter();
    return (
        <div className="flex items-center justify-between px-4 pt-4 md:px-0 md:pt-0">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center"><Package className="mr-2 h-6 w-6"/>Delivery History</h1>
                    <p className="text-muted-foreground text-sm">View your past deliveries</p>
                </div>
            </div>
      </div>
    )
}

export default function OrdersHistoryPage() {
  return (
    <div className="space-y-6 md:p-6">
      <div className="hidden md:block">
        <OrdersHeader />
      </div>

      <Card className="shadow-none md:shadow-lg rounded-none md:rounded-lg border-x-0 md:border">
        <CardContent className="p-0">
           <RecentDeliveries />
        </CardContent>
      </Card>

    </div>
  );
}
