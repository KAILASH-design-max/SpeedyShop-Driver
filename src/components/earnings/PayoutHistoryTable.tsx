
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Truck, Gift, Star } from "lucide-react";

const transactions = [
    { description: "Base Pay", id: "TXN001", type: "Delivery", amount: 45.00, icon: Truck },
    { description: "Customer Tip", id: "TXN002", type: "Tip", amount: 10.00, icon: Gift },
    { description: "Peak Hour Bonus", id: "TXN003", type: "Bonus", amount: 50.00, icon: Star },
    { description: "Base Pay + Distance Pay", id: "TXN004", type: "Delivery", amount: 62.50, icon: Truck },
];

const getBadgeClass = (type: string) => {
    switch(type.toLowerCase()) {
        case 'delivery': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
        case 'tip': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
        case 'bonus': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100';
        default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
}

export function PayoutHistoryTable() {
    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A breakdown of your recent earnings and bonuses.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {transactions.map((transaction) => (
                        <li key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                             <div className="flex items-center gap-4">
                               <transaction.icon className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <p className="font-semibold">{transaction.description}</p>
                                    <p className="text-xs text-muted-foreground">ID: {transaction.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600">+₹{transaction.amount.toFixed(2)}</p>
                                <Badge variant="outline" className={cn("mt-1 capitalize", getBadgeClass(transaction.type))}>{transaction.type}</Badge>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
