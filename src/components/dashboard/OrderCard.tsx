
"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, User, FileText, MessageSquare, LifeBuoy } from "lucide-react";
import type { Order } from "@/types";

interface OrderCardProps {
  order: Order;
  onSupportChat: (orderId: string) => void;
  onCustomerChat: (order: Order) => void;
}

export function OrderCard({ order, onSupportChat, onCustomerChat }: OrderCardProps) {
  
  const displayItems = order.items.map(item => `${item.name} (x${item.quantity})`).join(", ");

  const handleSupportChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSupportChat(order.id);
  };
  
  const handleCustomerChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onCustomerChat(order);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</CardTitle>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" aria-label="Chat with customer" onClick={handleCustomerChatClick}>
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </Button>
             <Button variant="ghost" size="icon" aria-label="Chat with support" onClick={handleSupportChatClick}>
                <LifeBuoy className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Badge variant={"secondary"} className="capitalize">
                {order.orderStatus.replace(/-/g, ' ')}
            </Badge>
          </div>
        </div>
        <CardDescription className="flex items-center text-sm pt-2 text-muted-foreground">
          <MapPin className="mr-2 h-4 w-4" /> 
          <span className="truncate" title={order.dropOffLocation}>{order.dropOffLocation}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm space-y-3 flex-grow">
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-muted-foreground" /> 
            <span className="font-semibold">{order.customerName}</span>
        </div>
        <div className="flex items-start">
          <Package className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
          <p className="font-semibold">{displayItems}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 mt-auto border-t">
        <Link href={`/orders/${order.id}`} className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <FileText className="mr-2 h-4 w-4"/> View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
