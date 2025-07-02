
"use client";

import { CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Wallet } from "lucide-react";


const transactions = [
    { title: "Base Pay", transactionId: "TXN001", type: "Delivery", amount: 45.00 },
    { title: "Customer Tip", transactionId: "TXN002", type: "Tip", amount: 10.00 },
    { title: "Peak Hour Bonus", transactionId: "TXN003", type: "Bonus", amount: 50.00 },
    { title: "Base Pay + Distance Pay", transactionId: "TXN004", type: "Delivery", amount: 62.50 },
    { title: "Base Pay", transactionId: "TXN005", type: "Delivery", amount: 52.00 },
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
        <div>
            <CardTitle className="text-2xl font-bold flex items-center"><Wallet className="mr-2 h-6 w-6"/>Transaction Summary</CardTitle>
            <CardDescription className="mt-1">A detailed breakdown of transactions for the selected day.</CardDescription>
            <div className="mt-6 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.transactionId}>
                                <TableCell className="font-medium">{transaction.title}</TableCell>
                                <TableCell className="text-muted-foreground">{transaction.transactionId}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("capitalize font-normal", getBadgeClass(transaction.type))}>{transaction.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                    +₹{transaction.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
