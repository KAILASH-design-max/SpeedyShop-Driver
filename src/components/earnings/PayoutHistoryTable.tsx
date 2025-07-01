
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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


const transactions = [
    { description: "Base Pay", id: "TXN001", type: "Delivery", amount: 45.00 },
    { description: "Customer Tip", id: "TXN002", type: "Tip", amount: 10.00 },
    { description: "Peak Hour Bonus", id: "TXN003", type: "Bonus", amount: 50.00 },
    { description: "Base Pay + Distance Pay", id: "TXN004", type: "Delivery", amount: 62.50 },
    { description: "Base Pay", id: "TXN005", type: "Delivery", amount: 52.00 },
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
                <CardDescription>A detailed breakdown of your recent earnings and deductions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Transaction</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id} className="border-b-0">
                                <TableCell>
                                    <div className="font-medium">{transaction.description}</div>
                                    <div className="text-xs text-muted-foreground">{transaction.id}</div>
                                </TableCell>
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
            </CardContent>
        </Card>
    );
}
