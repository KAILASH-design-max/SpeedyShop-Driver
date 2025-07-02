
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RecentDeliveries } from "@/components/orders/RecentDeliveries";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrdersHistoryPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
           {/* The RecentDeliveries component contains its own header now */}
        </CardHeader>
        <CardContent className="space-y-8">
           <RecentDeliveries />
           <Separator />
           <PayoutHistoryTable />
        </CardContent>
      </Card>

    </div>
  );
}
