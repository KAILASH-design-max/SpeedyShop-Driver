
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, MapPin, ThumbsUp, Truck } from "lucide-react";
import type { Order } from "@/types";
import { useState } from "react";
import Link from 'next/link';

interface AvailableOrderCardProps {
  order: Order;
  onAccept: (order: Order) => void;
}

export function AvailableOrderCard({ order, onAccept }: AvailableOrderCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptClick = async () => {
    setIsAccepting(true);
    try {
        await onAccept(order);
    } catch (e) {
        // Error is handled in the parent component's toast
        setIsAccepting(false);
    }
    // No need to set isAccepting to false on success, as the component will unmount
  };

  const distancePickup = (Math.random() * (3 - 0.5) + 0.5).toFixed(1);
  const distanceDrop = (Math.random() * (5 - 1) + 1).toFixed(1);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-card border-border/50 hover:border-accent/50">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-primary">₹{order.estimatedEarnings.toFixed(2)}</CardTitle>
            <span className="text-sm text-muted-foreground font-medium">{order.estimatedTime} min</span>
        </div>
        <CardDescription className="text-xs">Potential Earning</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-3 flex-grow">
        <div className="flex items-center gap-3 p-2 rounded-md bg-muted/40">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="truncate">
            <p className="font-medium truncate" title={order.pickupLocation}>{order.pickupLocation}</p>
            <p className="text-xs text-muted-foreground">{distancePickup} km away</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-md bg-muted/40">
          <Truck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="truncate">
            <p className="font-medium truncate" title={order.dropOffLocation}>{order.dropOffLocation}</p>
            <p className="text-xs text-muted-foreground">{distanceDrop} km trip</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 mt-auto bg-muted/20 border-t flex items-center gap-2">
        <Button 
          onClick={handleAcceptClick} 
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
          disabled={isAccepting}
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          {isAccepting ? "Accepting..." : "Accept"}
        </Button>
        <Button asChild variant="outline" size="sm">
            <Link href={`/orders/${order.id}`}>Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
