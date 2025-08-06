
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RecentDeliveries } from "@/components/orders/RecentDeliveries";
import { PayoutHistoryTable, Transaction } from "@/components/earnings/PayoutHistoryTable";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Order } from "@/types";

export default function OrdersHistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveries, setDeliveries] = useState<Order[]>([]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
           {/* The RecentDeliveries component contains its own header now */}
        </CardHeader>
        <CardContent className="space-y-8">
           <RecentDeliveries 
             onDeliveriesFetched={setDeliveries} 
             onTransactionsCalculated={setTransactions} 
           />
           <Separator />
           <PayoutHistoryTable transactions={transactions} deliveries={deliveries} />
        </CardContent>
      </Card>

    </div>
  );
}
