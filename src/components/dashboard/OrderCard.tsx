
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Clock, ArrowRight, Loader2, Store, User, Milestone } from "lucide-react";
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
  const isNewOrder = type === "new";
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    if (!currentUserId && isNewOrder) {
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

  const handleReject = async () => {
    setIsRejecting(true);
    // In a real app, this might add the driver's ID to a 'rejectedBy' array in Firestore
    // to prevent showing it again. For now, we'll just show a toast.
    setTimeout(() => {
        toast({
            title: "Order Declined",
            description: `You have declined order #${order.id.substring(0,8)}.`,
        });
        setIsRejecting(false);
    }, 500);
  };
  
  const displayItems = order.items.map(item => `${item.name} (x${item.quantity})`).join(", ");
  // This is a mock value based on time to match the design. A real app would get this from the backend.
  const mockDistance = (order.estimatedTime / 4 + Math.random()).toFixed(1); 

  // Active orders have a simpler card that links to the details page
  if (type === 'active') {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</CardTitle>
            <Badge variant={"secondary"} className="capitalize">
              {order.orderStatus}
            </Badge>
          </div>
          <CardDescription className="flex items-center text-sm pt-2">
            <MapPin className="mr-2 h-4 w-4 text-primary" /> 
            Drop-off: {order.dropOffLocation}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex items-center">
            <Package className="mr-2 h-4 w-4 text-muted-foreground" /> Items: {displayItems}
          </div>
        </CardContent>
        <CardFooter>
          <Link href={`/orders/${order.id}`} className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              View Details <ArrowRight className="ml-2 h-4 w-4"/>
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
            <Button onClick={handleReject} variant="ghost" className="flex-1 text-muted-foreground" disabled={isAccepting || isRejecting}>
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Decline"}
            </Button>
            <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold" disabled={isAccepting || isRejecting}>
              {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
        </CardFooter>
    </Card>
  );
}
