
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order } from "@/types";
import { OrderDetailsDisplay } from "@/components/orders/OrderDetailsDisplay";
import { DeliveryConfirmation } from "@/components/orders/DeliveryConfirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navigation, PackageCheck, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data fetching function
const fetchOrderDetails = async (id: string): Promise<Order | null> => {
  console.log("Fetching order:", id);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  const mockOrders: Order[] = [
    { id: "ORD789DEF", customerName: "Carol White", pickupLocation: "East Dark Store", dropOffLocation: "789 Pine Ln, Anytown", items: ["Pharmacy Items", "Band-aids"], status: "accepted", estimatedEarnings: 9.25, estimatedTime: 30, deliveryInstructions: "Leave at front porch if no answer.", customerContact: "555-0100" },
    { id: "ORD123XYZ", customerName: "Alice Smith", pickupLocation: "North Dark Store", dropOffLocation: "123 Main St, Anytown", items: ["Groceries", "Snacks"], status: "picked-up", estimatedEarnings: 7.50, estimatedTime: 25, deliveryInstructions: "Ring bell twice.", customerContact: "555-0101" },
  ];
  return mockOrders.find(order => order.id === id) || null;
};

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = typeof params.id === 'string' ? params.id : '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId).then(data => {
        setOrder(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const handlePickupConfirmation = () => {
    if (order && order.status === "accepted") {
      setOrder({ ...order, status: "picked-up" });
      toast({ title: "Pickup Confirmed", description: `Order ${order.id.substring(0,8)} marked as picked-up.`, className: "bg-blue-500 text-white" });
    }
  };
  
  const handleStartNavigation = () => {
      if (order?.dropOffLocation) {
        // In a real app, this would integrate with a mapping service
        // For now, let's open Google Maps with the address
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.dropOffLocation)}`;
        window.open(mapsUrl, "_blank");
        toast({ title: "Navigation Started", description: `Routing to ${order.dropOffLocation}.`});
      }
  };

  const handleDeliveryConfirmed = () => {
    if (order) {
      setOrder({ ...order, status: "delivered" });
      // Potentially navigate away or update UI further
      router.push("/dashboard");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading order details...</p></div>;
  }

  if (!order) {
    return <div className="flex justify-center items-center h-full"><p>Order not found.</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <OrderDetailsDisplay order={order} />
      
      <Separator className="my-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            {order.status === "accepted" && (
              <Button onClick={handlePickupConfirmation} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <PackageCheck className="mr-2 h-5 w-5" /> Confirm Pickup from Store
              </Button>
            )}
             {(order.status === "picked-up" || order.status === "out-for-delivery") && (
              <Button onClick={handleStartNavigation} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Navigation className="mr-2 h-5 w-5" /> Start Navigation to Customer
              </Button>
            )}
             <Button variant="outline" className="w-full" onClick={() => router.push(`/communication?orderId=${order.id}`)}>
                <MessageSquare className="mr-2 h-5 w-5" /> Contact Customer
            </Button>
          </CardContent>
        </Card>

        {(order.status === "picked-up" || order.status === "out-for-delivery") && (
          <DeliveryConfirmation orderId={order.id} onConfirm={handleDeliveryConfirmed} />
        )}
      </div>

      {order.status === "delivered" && (
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-semibold text-green-700">This order has been successfully delivered!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
