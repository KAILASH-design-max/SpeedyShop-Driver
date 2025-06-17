
"use client";

import type { Order } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Package, Phone, Info, ListChecks } from "lucide-react";

interface OrderDetailsDisplayProps {
  order: Order | null;
}

export function OrderDetailsDisplay({ order }: OrderDetailsDisplayProps) {
  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-primary">Order #{order.id.substring(0,8)}</CardTitle>
          <Badge variant="secondary" className="text-sm capitalize">{order.status}</Badge>
        </div>
        <CardDescription>Detailed information for the current order.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-lg mb-2 flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Customer Details</h3>
          <p><span className="font-medium">Name:</span> {order.customerName}</p>
          {order.customerContact && <p><span className="font-medium">Contact:</span> <a href={`tel:${order.customerContact}`} className="text-primary hover:underline flex items-center"><Phone className="mr-1 h-4 w-4" /> {order.customerContact}</a></p>}
        </div>

        <div className="p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-lg mb-2 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" />Delivery Locations</h3>
          <p><span className="font-medium">Pickup:</span> {order.pickupLocation}</p>
          <p><span className="font-medium">Drop-off:</span> {order.dropOffLocation}</p>
        </div>

        <div className="p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-lg mb-2 flex items-center"><Package className="mr-2 h-5 w-5 text-primary" />Order Items</h3>
          <ul className="list-disc list-inside">
            {order.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        
        {order.deliveryInstructions && (
          <div className="p-4 border rounded-lg bg-accent/10">
            <h3 className="font-semibold text-lg mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-accent" />Delivery Instructions</h3>
            <p>{order.deliveryInstructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
