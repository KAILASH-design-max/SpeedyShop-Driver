
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, User, FileText, MessageSquare, Store, Home, Truck, ChevronRight, PackageCheck } from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";


interface OrderCardProps {
  order: Order;
  onCustomerChat: (order: Order) => void;
}

const statusInfo: { [key in Order['orderStatus']]?: { icon: React.ElementType, label: string, color: string } } = {
    'accepted': { icon: PackageCheck, label: 'Accepted', color: 'text-blue-500' },
    'arrived-at-store': { icon: Store, label: 'At Store', color: 'text-teal-500' },
    'picked-up': { icon: Truck, label: 'Picked Up', color: 'text-cyan-500' },
    'out-for-delivery': { icon: Truck, label: 'Out for Delivery', color: 'text-purple-500' },
    'arrived': { icon: MapPin, label: 'Arrived at Drop-off', color: 'text-indigo-500' },
}

export function OrderCard({ order, onCustomerChat }: OrderCardProps) {

  const handleCustomerChatClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to order details
    e.stopPropagation(); // Stop event bubbling
    onCustomerChat(order);
  }
  
  const currentStatus = statusInfo[order.orderStatus];

  return (
    <Link href={`/orders/${order.id}`} className="block hover:no-underline group">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group-hover:border-primary">
            {currentStatus && (
                <CardHeader className={cn("p-4 flex flex-row items-center justify-between", currentStatus.color.replace('text-','bg-') + '/10')}>
                    <div className="flex items-center gap-2">
                        <currentStatus.icon className={cn("h-5 w-5", currentStatus.color)} />
                        <CardTitle className={cn("text-base font-semibold", currentStatus.color)}>
                            {currentStatus.label}
                        </CardTitle>
                    </div>
                    <Badge variant={"secondary"} className="capitalize">
                        #{order.id.substring(0, 6)}
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

            <CardFooter className="p-3 mt-auto border-t bg-muted/30">
                <div className="flex justify-between items-center w-full">
                     <Button variant="ghost" size="sm" aria-label="Chat with customer" onClick={handleCustomerChatClick}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat
                    </Button>
                    <div className="flex items-center text-primary font-semibold text-sm group-hover:underline">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
            </CardFooter>
        </Card>
    </Link>
  );
}
