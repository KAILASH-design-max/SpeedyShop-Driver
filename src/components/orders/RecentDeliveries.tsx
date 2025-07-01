
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const deliveries = [
    { name: "Rohan Sharma", orderId: "#426951", amount: 45.00 },
    { name: "Priya Patel", orderId: "#229577", amount: 62.50 },
    { name: "Amit Singh", orderId: "#321000", amount: 38.00 },
    { name: "Sneha Gupta", orderId: "#501507", amount: 75.00 },
    { name: "Vikram Kumar", orderId: "#520348", amount: 51.25 },
    { name: "Anjali Mehta", orderId: "#611234", amount: 48.75 },
];

export function RecentDeliveries() {
    return (
        <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Recent Deliveries</CardTitle>
                <CardDescription>You've completed {deliveries.length} deliveries today.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-1">
                    {deliveries.map((delivery, index) => (
                        <li key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 bg-muted">
                                    <AvatarFallback className="text-md font-semibold bg-primary/10 text-primary">
                                        {delivery.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-foreground">{delivery.name}</p>
                                    <p className="text-sm text-muted-foreground">Order {delivery.orderId}</p>
                                </div>
                            </div>
                            <p className="font-bold text-green-600 text-md">
                                ₹{delivery.amount.toFixed(2)}
                            </p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
