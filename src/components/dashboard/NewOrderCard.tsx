
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Milestone, Store, User, Wallet, BellRing } from "lucide-react";
import type { Order } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";

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
  
  const mockDistance = (order.estimatedTime / 4 + Math.random()).toFixed(1); 

  if (isDeclined) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-primary/50 bg-primary/5 transition-all duration-300 flex flex-col">
        <CardHeader className="p-3 bg-primary/10">
            <CardTitle className="flex items-center text-primary text-base">
                 <BellRing className="mr-2 h-5 w-5 animate-pulse" />
                 NEW DELIVERY ASSIGNMENT
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
            <div className="space-y-2 text-sm">
                <p className="font-semibold">Order ID: #{order.id.substring(0,8)}</p>
                <div className="flex items-start gap-2">
                    <Store className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="font-medium" title={order.pickupLocation}>Pickup: {order.pickupLocation}</span>
                </div>
                <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="font-medium" title={order.customerName}>Drop: {order.customerName}</span>
                </div>
            </div>
            
            <Separator className="my-3"/>
            
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1 rounded-md bg-background">
                    <div className="text-xs text-muted-foreground">Earn</div>
                    <div className="font-bold text-base text-green-600 flex items-center justify-center gap-1">
                        <Wallet size={14}/>
                        ₹{order.estimatedEarnings.toFixed(2)}
                    </div>
                </div>
                <div className="p-1 rounded-md bg-background">
                    <div className="text-xs text-muted-foreground">Time</div>
                    <div className="font-bold text-base flex items-center justify-center gap-1">
                        <Clock size={14} />
                        {order.estimatedTime}m
                    </div>
                </div>
                <div className="p-1 rounded-md bg-background">
                    <div className="text-xs text-muted-foreground">Dist.</div>
                    <div className="font-bold text-base flex items-center justify-center gap-1">
                        <Milestone size={14} />
                        {mockDistance}km
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 p-2 bg-primary/10 mt-auto">
            <Button onClick={() => handleDecline(false)} variant="ghost" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 h-10 font-bold" disabled={isAccepting}>
              Reject
            </Button>
            <div className="font-mono text-lg text-primary font-bold">
              00:{countdown.toString().padStart(2, '0')}
            </div>
            <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold h-10" disabled={isAccepting}>
              {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
        </CardFooter>
    </Card>
  );
}
