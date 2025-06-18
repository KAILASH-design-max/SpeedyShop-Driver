
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order, OrderItem } from "@/types";
import { OrderDetailsDisplay } from "@/components/orders/OrderDetailsDisplay";
import { DeliveryConfirmation } from "@/components/orders/DeliveryConfirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navigation, PackageCheck, MessageSquare, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, DocumentData } from "firebase/firestore";

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = typeof params.id === 'string' ? params.id : '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const mapFirestoreDocToOrder = (docSnap: DocumentData): Order => {
    const data = docSnap.data();
    const address = data.address || {};
    
    let items: OrderItem[] = [];
    if (Array.isArray(data.items)) {
      items = data.items.map((item: any) => ({
        name: item.name || "Unknown Item",
        quantity: item.quantity || 0,
        price: item.price,
        productId: item.productId,
        imageUrl: item.imageUrl,
      }));
    }
    
    const dropOffStreet = address.street || '';
    const dropOffCity = address.city || '';
    const dropOffPostalCode = address.postalCode || '';
    let dropOffLocationString = `${dropOffStreet}, ${dropOffCity} ${dropOffPostalCode}`.trim();
    if (dropOffLocationString.startsWith(',')) dropOffLocationString = dropOffLocationString.substring(1).trim();
    if (dropOffLocationString.endsWith(',')) dropOffLocationString = dropOffLocationString.slice(0, -1).trim();
    if (dropOffLocationString === ',' || !dropOffLocationString) dropOffLocationString = "N/A";


    return {
      id: docSnap.id,
      customerName: data.customerName || "Customer",
      pickupLocation: data.pickupLocation || "Default Pickup Location",
      dropOffLocation: dropOffLocationString,
      items: items,
      orderStatus: data.orderStatus || "Placed",
      estimatedEarnings: data.estimatedEarnings || (data.total ? data.total * 0.1 : 0) || 50,
      estimatedTime: data.estimatedTime || 30,
      deliveryInstructions: data.deliveryInstructions,
      customerContact: data.phoneNumber || address.phoneNumber,
      deliveryPartnerId: data.deliveryPartnerId,
    };
  };

  useEffect(() => {
    if (orderId) {
      const orderRef = doc(db, "orders", orderId);
      const unsubscribe = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
          setOrder(mapFirestoreDocToOrder(docSnap));
        } else {
          setOrder(null);
          toast({ variant: "destructive", title: "Error", description: "Order not found." });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching order details:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch order details." });
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No order ID provided."});
    }
  }, [orderId, toast]);

  const handlePickupConfirmation = async () => {
    if (order && order.orderStatus === "accepted") { 
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { orderStatus: "picked-up" }); 
        toast({ title: "Pickup Confirmed", description: `Order ${order.id.substring(0,8)} marked as picked-up.`, className: "bg-blue-500 text-white" });
      } catch (error) {
        console.error("Error confirming pickup:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not confirm pickup." });
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  const handleStartNavigation = () => {
      if (order?.dropOffLocation) {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.dropOffLocation)}`;
        window.open(mapsUrl, "_blank");
        toast({ title: "Navigation Started", description: `Routing to ${order.dropOffLocation}.`});
      }
  };

  const handleDeliveryConfirmed = async () => {
    if (order) {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { orderStatus: "delivered" }); 
        toast({ title: "Delivery Confirmed!", description: `Order ${order.id.substring(0,8)} marked as delivered.`, className: "bg-green-500 text-white" });
        router.push("/dashboard");
      } catch (error) {
        console.error("Error confirming delivery:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not confirm delivery." });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return <div className="flex justify-center items-center h-full"><p>Order not found or an error occurred.</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <OrderDetailsDisplay order={order} />
      
      <Separator className="my-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            {order.orderStatus === "accepted" && ( 
              <Button onClick={handlePickupConfirmation} className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <PackageCheck className="mr-2 h-5 w-5" /> Confirm Pickup from Store
              </Button>
            )}
             {(order.orderStatus === "picked-up" || order.orderStatus === "out-for-delivery") && ( 
              <Button onClick={handleStartNavigation} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isUpdating}>
                <Navigation className="mr-2 h-5 w-5" /> Start Navigation to Customer
              </Button>
            )}
             <Button variant="outline" className="w-full" onClick={() => router.push(`/communication?orderId=${order.id}`)} disabled={isUpdating}>
                <MessageSquare className="mr-2 h-5 w-5" /> Contact Customer
            </Button>
          </CardContent>
        </Card>

        {(order.orderStatus === "picked-up" || order.orderStatus === "out-for-delivery") && ( 
          <DeliveryConfirmation orderId={order.id} onConfirm={handleDeliveryConfirmed} />
        )}
      </div>

      {order.orderStatus === "delivered" && ( 
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
