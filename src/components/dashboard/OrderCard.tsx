
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Clock, ArrowRight, Loader2, Store, User, Milestone, FileText } from "lucide-react";
import type { Order } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface OrderCardProps {
  order: Order;
  type: "new" | "active";
  currentUserId?: string; // Optional: only needed for 'new' type to assign driver
}

export function OrderCard({ order, type, currentUserId }: OrderCardProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    if (!currentUserId && type === "new") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not available to accept order.",
      });
      return;
    }

    setIsAccepting(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { 
        orderStatus: "accepted",
        deliveryPartnerId: currentUserId // Assign current user as delivery partner
      });
      toast({
        title: "Order Accepted!",
        description: `Order #${order.id.substring(0,8)} has been moved to active orders.`,
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        variant: "destructive",
        title: "Acceptance Failed",
        description: "Could not accept the order. Please try again.",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    // In a real app, this might add the driver's ID to a 'rejectedBy' array in Firestore
    // to prevent showing it again. This is a mock implementation for the UI.
    toast({
        title: "Order Declined",
        description: `You have declined order #${order.id.substring(0,8)}. The order will be offered to another driver.`,
    });
    // In a real implementation, you would then hide this order card from the current driver's UI.
  };
  
  const displayItems = order.items.map(item => `${item.name} (x${item.quantity})`).join(", ");
  const mockDistance = (order.estimatedTime / 4 + Math.random()).toFixed(1); 

  if (type === 'active') {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</CardTitle>
            <Badge variant={"secondary"} className="capitalize">
              {order.orderStatus.replace('-', ' ')}
            </Badge>
          </div>
          <CardDescription className="flex items-center text-sm pt-2 text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" /> 
            <span className="truncate" title={order.dropOffLocation}>{order.dropOffLocation}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm space-y-3 flex-grow">
           <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" /> 
              <span className="font-semibold">{order.customerName}</span>
          </div>
          <div className="flex items-start">
            <Package className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="font-semibold">{displayItems}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 mt-auto border-t">
          <Link href={`/orders/${order.id}`} className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <FileText className="mr-2 h-4 w-4"/> View Details
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Redesigned Card for New Order Alerts
  return (
    <Card className="shadow-lg border-2 border-transparent hover:border-primary transition-all duration-300 flex flex-col">
        <CardHeader className="p-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                    <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={order.pickupLocation}>{order.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={order.customerName}>{order.customerName}</span>
                </div>
            </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 flex-grow">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-center mb-4">
                <div className="p-2 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Earnings</div>
                    <div className="font-bold text-lg text-green-600 flex items-center justify-center">
                        ₹{order.estimatedEarnings.toFixed(2)}
                    </div>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Est. Time</div>
                    <div className="font-bold text-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {order.estimatedTime} mins
                    </div>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Distance</div>
                    <div className="font-bold text-lg flex items-center justify-center">
                        <Milestone className="h-4 w-4 mr-1" />
                        {mockDistance} km
                    </div>
                </div>
                 <div className="p-2 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <Badge variant="outline" className="capitalize mt-1 font-semibold">
                        New
                    </Badge>
                </div>
            </div>
            
            <div>
                 <div className="text-xs text-muted-foreground mb-1">Items</div>
                 <p className="font-bold text-sm leading-snug">{displayItems}</p>
            </div>
        </CardContent>
        <CardFooter className="flex gap-3 p-3 bg-muted/30 mt-auto">
            <Button onClick={handleReject} variant="ghost" className="flex-1 text-muted-foreground" disabled={isAccepting}>
              Decline
            </Button>
            <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold" disabled={isAccepting}>
              {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
        </CardFooter>
    </Card>
  );
}
