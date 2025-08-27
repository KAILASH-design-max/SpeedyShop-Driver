
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, User, FileText, MessageSquare, Store, Home, Truck, ChevronRight, PackageCheck, Navigation, CheckCircle } from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";


interface OrderCardProps {
  order: Order;
  onCustomerChat: (order: Order) => void;
}

const statusInfo: { [key in Order['status']]?: { icon: React.ElementType, label: string, color: string, action: { href: (orderId: string, dest: string) => string; text: string, icon: React.ElementType } | null } } = {
    'accepted': { 
        icon: PackageCheck, 
        label: 'Accepted', 
        color: 'text-accent',
        action: { href: (orderId, dest) => `/orders/${orderId}`, text: "Go to Store", icon: Store }
    },
    'arrived-at-store': { 
        icon: Store, 
        label: 'At Store', 
        color: 'text-teal-400',
        action: { href: (orderId, dest) => `/orders/${orderId}`, text: "Confirm Pickup", icon: PackageCheck }
    },
    'picked-up': { 
        icon: Truck, 
        label: 'Picked Up', 
        color: 'text-cyan-400',
        action: { href: (orderId, dest) => `/navigate/${orderId}?destination=${encodeURIComponent(dest)}&type=dropoff`, text: "Navigate to Customer", icon: Navigation }
    },
    'out-for-delivery': { 
        icon: Truck, 
        label: 'Out for Delivery', 
        color: 'text-purple-400',
        action: { href: (orderId, dest) => `/navigate/${orderId}?destination=${encodeURIComponent(dest)}&type=dropoff`, text: "Navigate to Customer", icon: Navigation }
    },
     'arrived': { 
        icon: MapPin, 
        label: 'Arrived at Drop-off', 
        color: 'text-indigo-400',
        action: { href: (orderId, dest) => `/orders/${orderId}`, text: "Confirm Delivery", icon: CheckCircle }
    },
}

export function OrderCard({ order, onCustomerChat }: OrderCardProps) {

  const handleCustomerChatClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    onCustomerChat(order);
  }
  
  const currentStatus = statusInfo[order.status];
  
  const getNavAction = () => {
      if (!currentStatus || !currentStatus.action) return null;
      const destination = order.status === 'accepted' ? order.pickupLocation : order.dropOffLocation;
      return {
          href: currentStatus.action.href(order.id, destination),
          text: currentStatus.action.text,
          Icon: currentStatus.action.icon,
      }
  }

  const navAction = getNavAction();

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-card/80 border-border/50 hover:border-primary/50">
        {currentStatus && (
            <CardHeader className={cn("p-4 flex flex-row items-center justify-between", `bg-${currentStatus.color.replace('text-','').replace('-400','').replace('-500','').replace('-accent','orange')}-500/10 border-b border-${currentStatus.color.replace('text-','').replace('-400','').replace('-500','').replace('-accent','orange')}-500/20`)}>
                <div className="flex items-center gap-2">
                    <currentStatus.icon className={cn("h-5 w-5", currentStatus.color)} />
                    <CardTitle className={cn("text-base font-semibold", currentStatus.color)}>
                        {currentStatus.label}
                    </CardTitle>
                </div>
                <Badge variant={"secondary"} className="capitalize bg-muted/50 border-border/50 text-muted-foreground">
                    #{order.id.substring(0,6)}
                </Badge>
            </CardHeader>
        )}

        <CardContent className="p-4 pt-4 text-sm space-y-3 flex-grow">
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
                    <p className="text-xs text-muted-foreground">Drop-off for {order.customerName}</p>
                    <p className="font-medium" title={order.dropOffLocation}>{order.dropOffLocation}</p>

                </div>
            </div>
        </CardContent>

        <CardFooter className="p-3 mt-auto border-t bg-muted/20 flex flex-col items-stretch gap-2">
            {navAction && (
                <Button asChild size="lg" className="font-bold bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href={navAction.href}>
                        <navAction.Icon className="mr-2 h-4 w-4" />
                        {navAction.text}
                    </Link>
                </Button>
            )}
            <div className="flex justify-between items-center w-full">
                 <Button variant="ghost" size="sm" aria-label="Chat with customer" onClick={handleCustomerChatClick}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                </Button>
                <Button asChild variant="link" className="text-primary font-semibold text-sm hover:underline p-0 h-auto">
                    <Link href={`/orders/${order.id}`} className="flex items-center">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </Button>
            </div>
        </CardFooter>
    </Card>
  );
}
