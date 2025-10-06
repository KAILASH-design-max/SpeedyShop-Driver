
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MessageSquare, CheckCircle, PackageCheck } from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


interface OrderCardProps {
  order: Order;
  onCustomerChat: (order: Order) => void;
}

const statusInfo: { [key in Order['status']]?: { label: string, color: string, action: { href: (orderId: string) => string; text: string } | null } } = {
    'accepted': { label: 'Accepted', color: 'text-accent', action: { href: (orderId) => `/orders/${orderId}`, text: "Go to Pickup" }},
    'arrived-at-store': { label: 'At Store', color: 'text-teal-400', action: { href: (orderId) => `/orders/${orderId}`, text: "Confirm Pickup" }},
    'picked-up': { label: 'Picked Up', color: 'text-cyan-400', action: { href: (orderId) => `/orders/${orderId}`, text: "Navigate to Customer" }},
    'out-for-delivery': { label: 'Out for Delivery', color: 'text-purple-400', action: { href: (orderId) => `/orders/${orderId}`, text: "Navigate to Customer" }},
    'arrived': { label: 'Arrived', color: 'text-indigo-400', action: { href: (orderId) => `/orders/${orderId}`, text: "Confirm Delivery" }},
    'delivered': { label: 'Delivered', color: 'text-green-500', action: null },
    'cancelled': { label: 'Cancelled', color: 'text-destructive', action: null }
}

export function OrderCard({ order, onCustomerChat }: OrderCardProps) {

  const handleCustomerChatClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    onCustomerChat(order);
  }
  
  const currentStatus = statusInfo[order.status];
  const navAction = currentStatus?.action ? { href: currentStatus.action.href(order.id), text: currentStatus.action.text } : null;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
        <CardHeader className="p-4">
            <div className="flex justify-between items-start">
                <div>
                     {currentStatus && (
                        <div className="flex items-center gap-2">
                           <span className={cn("h-2.5 w-2.5 rounded-full", currentStatus.color.replace('text-','bg-'))}></span>
                           <CardTitle className={cn("text-base font-semibold", currentStatus.color)}>
                             {currentStatus.label}
                           </CardTitle>
                        </div>
                     )}
                     <p className="text-xs text-muted-foreground mt-1">Order #{order.id.substring(0,6)} &bull; {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'})}</p>
                </div>
                <Link href={`/orders/${order.id}`}>
                    <Button variant="secondary" size="sm">Details</Button>
                </Link>
            </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary">
                    <AvatarFallback>{order.customerName.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-lg">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.dropOffLocation}</p>
                    <p className="text-sm text-muted-foreground">{order.customerContact}</p>
                </div>
            </div>
        </CardContent>

        <CardFooter className="p-4 mt-auto border-t flex flex-col gap-2">
            {navAction && (
                <Button asChild className="w-full text-base font-bold py-6">
                    <Link href={navAction.href}>
                        {navAction.text}
                    </Link>
                </Button>
            )}
             <div className="flex w-full gap-2">
                <Button variant="outline" className="w-full" onClick={handleCustomerChatClick}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                </Button>
                {order.status === 'arrived' && (
                    <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white">
                        <Link href={`/orders/${order.id}`}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm
                        </Link>
                    </Button>
                )}
             </div>
        </CardFooter>
    </Card>
  );
}
