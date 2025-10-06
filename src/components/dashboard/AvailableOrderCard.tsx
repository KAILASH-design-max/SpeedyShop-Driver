
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
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl font-bold text-primary flex items-center">
                    <IndianRupee className="h-5 w-5 mr-1"/>{order.estimatedEarnings.toFixed(2)}
                </CardTitle>
                <CardDescription className="text-xs mt-1">Potential Earning &bull; {order.estimatedTime} min</CardDescription>
            </div>
            <Link href={`/orders/${order.id}`}>
                <Button variant="secondary" size="sm">Details</Button>
            </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-3 flex-grow">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="truncate">
            <p className="font-semibold text-foreground truncate" title={order.pickupLocation}>{order.pickupLocation}</p>
            <p className="text-xs text-muted-foreground">{distancePickup} km away</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Truck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="truncate">
            <p className="font-semibold text-foreground truncate" title={order.dropOffLocation}>{order.dropOffLocation}</p>
            <p className="text-xs text-muted-foreground">{distanceDrop} km trip</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 mt-auto border-t">
        <Button 
          onClick={handleAcceptClick} 
          className="w-full text-base font-bold py-6 bg-green-500 hover:bg-green-600 text-white"
          disabled={isAccepting}
        >
          <ThumbsUp className="mr-2 h-5 w-5" />
          {isAccepting ? "Accepting..." : "Accept"}
        </Button>
      </CardFooter>
    </Card>
  );
}
