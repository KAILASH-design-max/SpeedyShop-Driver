
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, IndianRupee, Download } from "lucide-react";

export function WalletBalanceCard() {
    const walletBalance = 11868.00; // Static value for now

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold">
                    <Wallet className="mr-3 h-6 w-6 text-primary" />
                    Wallet Balance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center bg-muted/50 p-6 rounded-lg">
                    <p className="text-4xl font-bold text-primary flex items-center justify-center">
                        <IndianRupee size={30} className="mr-1" />
                        {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-muted-foreground mt-1">Next payout: Tuesday</p>
                </div>
                <Button className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Withdraw Funds
                </Button>
            </CardContent>
        </Card>
    );
}
