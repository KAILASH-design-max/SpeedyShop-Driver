"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Wallet } from "lucide-react";

// Mock data for monthly earnings history
const monthlyEarnings = [
  { month: "July 2025", earnings: "25,120.00" },
  { month: "June 2025", earnings: "21,300.00" },
  { month: "May 2025", earnings: "18,450.00" },
  { month: "April 2025", earnings: "22,500.00" },
];

export function MonthlyEarningsHistory() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-bold text-primary">
          <Calendar className="mr-3 h-6 w-6" />
          Monthly Earnings History
        </CardTitle>
        <CardDescription>
          A summary of your earnings from previous months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyEarnings.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex items-center">
                <Wallet className="mr-3 h-5 w-5 text-muted-foreground" />
                <p className="font-semibold">{item.month}</p>
              </div>
              <p className="font-bold text-lg text-green-600">₹{item.earnings}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
