
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Clock, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import type { Order } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const CurrencyIcon = () => <span className="font-semibold">₹</span>;

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
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { orderStatus: "cancelled" }); 
      toast({
        title: "Order Rejected",
        description: `Order #${order.id.substring(0,8)} has been rejected.`,
      });
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: "Could not reject the order. Please try again.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const displayItems = order.items.map(item => `${item.name} (x${item.quantity})`).join(", ");

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</CardTitle>
          <Badge variant={isNewOrder ? "destructive" : "secondary"} className="capitalize">
            {isNewOrder ? <AlertTriangle className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
            {order.orderStatus}
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
          <Package className="mr-2 h-4 w-4 text-muted-foreground" /> Items: {displayItems}
        </div>
        <div className="flex items-center">
          <CurrencyIcon /> <span className="ml-1 mr-2 text-muted-foreground">Est. Earnings:</span> {order.estimatedEarnings.toFixed(2)}
        </div>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" /> Est. Time: {order.estimatedTime} mins
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {isNewOrder ? (
          <>
            <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white" disabled={isAccepting || isRejecting}>
              {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Accept
            </Button>
            <Button onClick={handleReject} variant="outline" className="flex-1" disabled={isAccepting || isRejecting}>
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
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
