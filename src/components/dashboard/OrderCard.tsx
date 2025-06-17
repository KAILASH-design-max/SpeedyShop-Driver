
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Clock, DollarSign, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import type { Order } from "@/types"; // We'll define this type

export function OrderCard({ order, type }: { order: Order, type: "new" | "active" }) {
  const isNewOrder = type === "new";

  const handleAccept = () => {
    // Mock accept logic
    console.log("Order accepted:", order.id);
    // Potentially update state or make API call
  };

  const handleReject = () => {
    // Mock reject logic
    console.log("Order rejected:", order.id);
    // Potentially update state or make API call
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</CardTitle>
          <Badge variant={isNewOrder ? "destructive" : "secondary"} className="capitalize">
            {isNewOrder ? <AlertTriangle className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
            {order.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-sm">
          <MapPin className="mr-2 h-4 w-4 text-primary" /> 
          Pickup: {order.pickupLocation}
        </CardDescription>
         <CardDescription className="flex items-center text-sm">
          <MapPin className="mr-2 h-4 w-4 text-accent" /> 
          Drop-off: {order.dropOffLocation}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center">
          <Package className="mr-2 h-4 w-4 text-muted-foreground" /> Items: {order.items.join(", ")}
        </div>
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Est. Earnings: ${order.estimatedEarnings.toFixed(2)}
        </div>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" /> Est. Time: {order.estimatedTime} mins
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {isNewOrder ? (
          <>
            <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white">Accept</Button>
            <Button onClick={handleReject} variant="outline" className="flex-1">Reject</Button>
          </>
        ) : (
          <Link href={`/orders/${order.id}`} className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              View Details <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
