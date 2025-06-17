
"use client";

import type { Payout } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PayoutHistoryTableProps {
  payouts: Payout[];
}

export function PayoutHistoryTable({ payouts }: PayoutHistoryTableProps) {
  return (
    <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Payout History</CardTitle>
            <CardDescription>Detailed records of your past payouts.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Transaction ID</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payouts.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No payout history available.
                        </TableCell>
                    </TableRow>
                )}
                {payouts.map((payout) => (
                <TableRow key={payout.id}>
                    <TableCell>{format(new Date(payout.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">${payout.amount.toFixed(2)}</TableCell>
                    <TableCell>
                    <Badge 
                        variant={payout.status === "completed" ? "default" : payout.status === "pending" ? "secondary" : "destructive"}
                        className={payout.status === "completed" ? "bg-green-500 text-white" : payout.status === "pending" ? "bg-yellow-500 text-black" : ""}
                    >
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{payout.transactionId || "N/A"}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            {payouts.length > 0 && <TableCaption>A summary of your recent payouts.</TableCaption>}
            </Table>
        </CardContent>
    </Card>
  );
}
