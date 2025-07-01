
"use client";

import type { Order } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Package, Phone, Info, Check, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderDetailsDisplayProps {
  order: Order | null;
}

const getStatusBadgeClass = (status: Order['orderStatus']) => {
  switch (status) {
    case 'accepted':
    case 'out-for-delivery':
    case 'picked-up':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function OrderDetailsDisplay({ order }: OrderDetailsDisplayProps) {
  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <Card className="w-full shadow-lg border-none">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Order #{order.id.substring(0,8)}</CardTitle>
            <CardDescription className="mt-1">Detailed delivery summary</CardDescription>
          </div>
          <Badge variant="outline" className={cn("text-sm capitalize font-semibold", getStatusBadgeClass(order.orderStatus))}>
            <Check className="mr-1 h-3.5 w-3.5" />
            {order.orderStatus.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details Card */}
            <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Customer Details</h3>
                <div className="space-y-1 text-sm">
                    <p><span className="font-medium text-muted-foreground">Name:</span> {order.customerName}</p>
                    {order.customerContact && (
                        <p>
                            <span className="font-medium text-muted-foreground">Contact:</span> 
                            <a href={`tel:${order.customerContact}`} className="text-primary hover:underline flex items-center gap-1">
                                <Phone className="h-4 w-4" /> {order.customerContact}
                            </a>
                        </p>
                    )}
                </div>
            </div>

            {/* Delivery Locations Card */}
            <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" />Delivery Route</h3>
                <div className="space-y-2 text-sm">
                    <p className="flex items-start"><Store className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" /><span className="font-medium text-muted-foreground mr-2">Pickup:</span> {order.pickupLocation}</p>
                    <p className="flex items-start"><MapPin className="mr-2 h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" /><span className="font-medium text-muted-foreground mr-2">Drop-off:</span> {order.dropOffLocation}</p>
                </div>
            </div>
        </div>

        {/* Order Items Card */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-lg mb-3 flex items-center"><Package className="mr-2 h-5 w-5 text-primary" />Items to Deliver</h3>
          <ul className="space-y-1">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span>{item.name}</span>
                <span className="font-medium text-muted-foreground">Qty: {item.quantity}</span>
              </li> 
            ))}
          </ul>
        </div>
        
        {order.deliveryInstructions && (
          <div className="p-4 border rounded-lg bg-accent/10 border-accent/30">
            <h3 className="font-semibold text-lg mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-accent" />Delivery Instructions</h3>
            <p className="text-sm text-accent-foreground/80">{order.deliveryInstructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
