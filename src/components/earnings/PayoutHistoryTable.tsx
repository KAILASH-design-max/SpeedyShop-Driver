
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
import type { Order, Transaction } from "@/types";

interface PayoutHistoryTableProps {
    transactions: Transaction[];
    deliveries: Order[]; // Keep deliveries to check if there's anything to show
}

const getBadgeClass = (type: string) => {
    switch(type.toLowerCase()) {
        case 'delivery': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
        case 'tip': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
        case 'bonus': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100';
        default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
}

export function PayoutHistoryTable({ transactions, deliveries }: PayoutHistoryTableProps) {
    const totalEarned = transactions.reduce((acc, t) => acc + t.amount, 0);

    return (
        <div>
            <CardTitle className="text-2xl font-bold flex items-center"><Wallet className="mr-2 h-6 w-6"/>Daily Transaction Breakdown</CardTitle>
            <CardDescription className="mt-1">A detailed breakdown of transactions for the selected day in your history.</CardDescription>
            <div className="mt-6 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.transactionId}>
                                    <TableCell className="font-medium">{transaction.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("capitalize font-normal", getBadgeClass(transaction.type))}>{transaction.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        +₹{transaction.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : deliveries.length > 0 ? (
                             <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                                    No tips or other transactions for this day's deliveries.
                                </TableCell>
                             </TableRow>
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                                    No transactions found for the selected date.
                                </TableCell>
                            </TableRow>
                        )}
                         {transactions.length > 0 && (
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={2}>Total Earned for Selected Day</TableCell>
                                <TableCell className="text-right text-lg text-green-700">
                                    ₹{totalEarned.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
