
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, User, FileText, MessageSquare, Store, Home, Truck, ChevronRight, PackageCheck, Navigation } from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";


interface OrderCardProps {
  order: Order;
  onCustomerChat: (order: Order) => void;
}

const statusInfo: { [key in Order['orderStatus']]?: { icon: React.ElementType, label: string, color: string } } = {
    'accepted': { icon: PackageCheck, label: 'Accepted', color: 'text-blue-400' },
    'arrived-at-store': { icon: Store, label: 'At Store', color: 'text-teal-400' },
    'picked-up': { icon: Truck, label: 'Picked Up', color: 'text-cyan-400' },
    'out-for-delivery': { icon: Truck, label: 'Out for Delivery', color: 'text-purple-400' },
    'arrived': { icon: MapPin, label: 'Arrived at Drop-off', color: 'text-indigo-400' },
}

export function OrderCard({ order, onCustomerChat }: OrderCardProps) {

  const handleCustomerChatClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    onCustomerChat(order);
  }
  
  const currentStatus = statusInfo[order.orderStatus];

  const getNavAction = () => {
    switch (order.orderStatus) {
        case 'accepted':
        case 'arrived-at-store':
            return {
                href: `/navigate/${order.id}?destination=${encodeURIComponent(order.pickupLocation)}&type=pickup`,
                text: "Navigate to Store"
            };
        case 'picked-up':
        case 'out-for-delivery':
             return {
                href: `/navigate/${order.id}?destination=${encodeURIComponent(order.dropOffLocation)}&type=dropoff`,
                text: "Navigate to Customer"
            };
        default:
            return null;
    }
  }

  const navAction = getNavAction();

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full bg-card/80 border-border/50 hover:border-primary/50">
        {currentStatus && (
            <CardHeader className={cn("p-4 flex flex-row items-center justify-between", "bg-accent/10 border-b border-accent/20")}>
                <div className="flex items-center gap-2">
                    <currentStatus.icon className={cn("h-5 w-5", "text-accent")} />
                    <CardTitle className={cn("text-base font-semibold", "text-accent")}>
                        {currentStatus.label}
                    </CardTitle>
                </div>
                <Badge variant={"secondary"} className="capitalize bg-muted/50 border-border/50 text-muted-foreground">
                    #{order.id}
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
                        <Navigation className="mr-2 h-4 w-4" />
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
