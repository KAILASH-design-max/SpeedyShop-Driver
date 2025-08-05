
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Milestone, Store, User, Wallet, BellRing, Package, Home, ShoppingBasket, X, Check } from "lucide-react";
import type { Order } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface NewOrderCardProps {
  order: Order;
  currentUserId: string;
}

// Data URI for a simple notification sound (a short, soft beep)
const notificationSound = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";


export function NewOrderCard({ order, currentUserId }: NewOrderCardProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to play notification sound when the card first renders
  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio(notificationSound);
        audioRef.current.play().catch(error => {
            console.warn("Audio playback failed. User interaction may be required.", error);
        });
    }
  }, []);


  useEffect(() => {
    if (isAccepting || isDeclined) return;

    if (countdown <= 0) {
      handleDecline(true); // Auto-decline when timer runs out
      return;
    }

    const timerId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [countdown, isAccepting, isDeclined]);

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

  const handleDecline = (isTimeout = false) => {
    setIsDeclined(true);
    toast({
        title: isTimeout ? "Order Timed Out" : "Order Declined",
        description: `You have declined order #${order.id.substring(0,8)}.`,
    });
  };
  
  const displayItems = order.items.map(item => `${item.quantity}x ${item.name}`).join(", ");

  if (isDeclined) {
    return null;
  }

  return (
    <Card className="shadow-xl border-2 border-transparent bg-background transition-all duration-300 flex flex-col w-full max-w-sm mx-auto">
        <CardHeader className="p-4 items-center">
            <div className="flex items-center text-xl font-bold text-foreground">
                 <Package className="mr-3 h-8 w-8 text-primary" />
                 New Delivery Assignment
            </div>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
            <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="text-lg font-bold">ORD{order.id.substring(0,5).toUpperCase()}</p>
            </div>
            
            <Card className="text-left w-full bg-muted/30">
                <CardContent className="p-4 space-y-4">
                     <div className="flex items-start gap-3">
                        <Store className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="text-xs text-muted-foreground">Pickup</p>
                           <p className="font-medium" title={order.pickupLocation}>{order.pickupLocation}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="text-xs text-muted-foreground">Drop</p>
                           <p className="font-medium" title={order.dropOffLocation}>{order.dropOffLocation} ({order.customerName})</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <ShoppingBasket className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="text-xs text-muted-foreground">Items</p>
                           <p className="font-medium" title={displayItems}>{displayItems}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="text-xs text-muted-foreground">Expected Delivery</p>
                           <p className="font-medium">{order.estimatedTime} mins</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </CardContent>
        <CardFooter className="flex flex-col items-center justify-between gap-2 p-4 pt-0">
            <div className="flex items-center gap-4 w-full">
                <Button onClick={() => handleDecline(false)} variant="destructive" className="flex-1 bg-red-500 hover:bg-red-600 h-12 text-base font-bold" disabled={isAccepting}>
                  <X className="mr-2 h-5 w-5"/> Reject
                </Button>
                <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white h-12 text-base font-bold" disabled={isAccepting}>
                  {isAccepting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="mr-2 h-5 w-5" /> Accept</>}
                </Button>
            </div>
             <div className="w-full mt-4">
                 <Progress value={(countdown / 60) * 100} className="h-2" />
                 <p className="text-center text-sm text-muted-foreground mt-2">Auto-rejecting in 00:{countdown.toString().padStart(2, '0')}</p>
            </div>
        </CardFooter>
    </Card>
  );
}
