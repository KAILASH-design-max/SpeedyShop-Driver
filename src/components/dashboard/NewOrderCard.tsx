
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Store, Home, ShoppingBasket, X, Check, Package, ThumbsUp } from "lucide-react";
import type { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NewOrderCardProps {
  order: Order;
  onDismiss: () => void;
}

// Data URI for a simple notification sound (a short, soft beep)
const notificationSound = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";


export function NewOrderCard({ order, onDismiss }: NewOrderCardProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Effect to play notification sound when the dialog opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio(notificationSound);
        audioRef.current.play().catch(error => {
            console.warn("Audio playback failed. User interaction may be required.", error);
        });
    }
  }, []);
  
  const displayItems = order.items.map(item => `${item.quantity}x ${item.name}`).join(", ");

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if(!isOpen) onDismiss() }}>
      <DialogContent className="sm:max-w-lg p-0" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center">
                <Package className="mr-3 h-8 w-8 text-primary" />
                 New Delivery Assignment
            </DialogTitle>
             <CardDescription className="text-center pt-2">
                A new order has been assigned to you.
             </CardDescription>
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
            <Link href={`/orders/${order.id}`} className="w-full">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-base font-bold">
                  <ThumbsUp className="mr-2 h-5 w-5" /> View Order Details
                </Button>
            </Link>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}
