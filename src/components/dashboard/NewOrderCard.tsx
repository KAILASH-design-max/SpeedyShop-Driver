
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Store, Home, ShoppingBasket, X, Check, Package } from "lucide-react";
import type { Order } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";

interface NewOrderCardProps {
  order: Order;
  currentUserId: string;
  onOrderAction: () => void;
}

// Data URI for a simple notification sound (a short, soft beep)
const notificationSound = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";


export function NewOrderCard({ order, currentUserId, onOrderAction }: NewOrderCardProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to play notification sound when the dialog opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio(notificationSound);
        audioRef.current.play().catch(error => {
            console.warn("Audio playback failed. User interaction may be required.", error);
        });
    }
  }, []);


  useEffect(() => {
    if (isAccepting) return;

    if (countdown <= 0) {
      handleDecline(true); // Auto-decline when timer runs out
      return;
    }

    const timerId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [countdown, isAccepting]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { 
        status: "accepted",
        deliveryPartnerId: currentUserId
      });
      toast({
        title: "Order Accepted!",
        description: `Order #${order.id} has been moved to your active orders.`,
        className: "bg-green-500 text-white",
      });
      onOrderAction();
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({
        variant: "destructive",
        title: "Acceptance Failed",
        description: "Could not accept the order. It may have been taken by another driver.",
      });
      setIsAccepting(false); // Allow retry if failed
    }
  };

  const handleDecline = (isTimeout = false) => {
    toast({
        title: isTimeout ? "Order Timed Out" : "Order Declined",
        description: `You have declined order #${order.id}.`,
    });
    onOrderAction();
  };
  
  const displayItems = order.items.map(item => `${item.quantity}x ${item.name}`).join(", ");

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if(!isOpen) handleDecline(false) }}>
      <DialogContent className="sm:max-w-lg p-0" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center">
                <Package className="mr-3 h-8 w-8 text-primary" />
                 New Delivery Assignment
            </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0 text-center space-y-4">
            <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="text-lg font-bold">#{order.id}</p>
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

        </div>
        <CardFooter className="flex flex-col items-center justify-between gap-2 p-4 pt-0 bg-muted/50">
            <div className="flex items-center gap-4 w-full">
                <Button onClick={() => handleDecline(false)} variant="destructive" className="flex-1 bg-red-500 hover:bg-red-600 h-12 text-base font-bold" disabled={isAccepting}>
                  <X className="mr-2 h-5 w-5"/> Reject
                </Button>
                <Button onClick={handleAccept} className="flex-1 bg-green-500 hover:bg-green-600 text-white h-12 text-base font-bold" disabled={isAccepting}>
                  {isAccepting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="mr-2 h-5 w-5" /> Accept</>}
                </Button>
            </div>
             <div className="w-full mt-4">
                 <Progress value={(countdown / 30) * 100} className="h-2" />
                 <p className="text-center text-sm text-muted-foreground mt-2">Auto-rejecting in 00:{countdown.toString().padStart(2, '0')}</p>
            </div>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}
