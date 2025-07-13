
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Milestone, Store, User, Wallet } from "lucide-react";
import type { Order } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface NewOrderCardProps {
  order: Order;
  currentUserId: string;
}

export function NewOrderCard({ order, currentUserId }: NewOrderCardProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false); // Used to hide card on decline

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { 
        orderStatus: "accepted",
        deliveryPartnerId: currentUserId
      });
      toast({
        title: "Order Accepted!",
        description: `Order #${order.id.substring(0,8)} has been moved to your active orders.`,
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        variant: "destructive",
        title: "Acceptance Failed",
        description: "Could not accept the order. It may have been taken by another driver.",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    // In a real app, this might add the driver's ID to a 'rejectedBy' array in Firestore
    // to prevent showing it again. For now, we'll just hide it from the UI.
    setIsDeclining(true);
    toast({
        title: "Order Declined",
        description: `You have declined order #${order.id.substring(0,8)}.`,
    });
  };
  
  const mockDistance = (order.estimatedTime / 4 + Math.random()).toFixed(1); 

  if (isDeclining) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-transparent hover:border-primary transition-all duration-300 flex flex-col">
        <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm truncate mb-2">
                <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-semibold truncate" title={order.pickupLocation}>{order.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm truncate">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-semibold truncate" title={order.customerName}>{order.customerName}</span>
            </div>
            <Separator className="my-3"/>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Earn</div>
                    <div className="font-bold text-base text-green-600 flex items-center justify-center gap-1">
                        <Wallet size={14}/>
                        ₹{order.estimatedEarnings.toFixed(2)}
                    </div>
                </div>
                <div className="p-1 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Time</div>
                    <div className="font-bold text-base flex items-center justify-center gap-1">
                        <Clock size={14} />
                        {order.estimatedTime}m
                    </div>
                </div>
                <div className="p-1 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Dist.</div>
                    <div className="font-bold text-base flex items-center justify-center gap-1">
                        <Milestone size={14} />
                        {mockDistance}km
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex gap-2 p-2 bg-muted/30 mt-auto">
            <Button onClick={handleDecline} variant="ghost" className="flex-1 text-muted-foreground h-9" disabled={isAccepting}>
              Decline
            </Button>
            <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold h-9" disabled={isAccepting}>
              {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
        </CardFooter>
    </Card>
  );
}
