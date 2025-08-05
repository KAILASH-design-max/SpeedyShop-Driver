
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type { Order } from "@/types";
import { OrderDetailsDisplay } from "@/components/orders/OrderDetailsDisplay";
import { DeliveryConfirmation } from "@/components/orders/DeliveryConfirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, PackageCheck, MessageSquare, Loader2, CheckCircle, AlertTriangle, ShieldX, Store, Truck, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { mapFirestoreDocToOrder } from "@/lib/orderUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateLocation } from "@/ai/flows/update-location-flow";
import { useThrottle } from "@/hooks/use-throttle";


export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = typeof params.id === 'string' ? params.id : '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const locationWatcherId = useRef<number | null>(null);

  const throttledLocationUpdate = useThrottle(async (position: GeolocationPosition) => {
    if (!order) return;
    try {
      await updateLocation({
        orderId: order.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error("Throttled location update failed:", error);
    }
  }, 10000); // Throttle to every 10 seconds

  useEffect(() => {
    // Load order from cache on initial render
    if (orderId) {
        try {
            const cachedOrder = localStorage.getItem(`order-cache-${orderId}`);
            if (cachedOrder) {
                setOrder(JSON.parse(cachedOrder));
            }
        } catch (error) {
            console.error(`Failed to load cached order ${orderId}:`, error);
        }
    }
  }, [orderId]);


  useEffect(() => {
    if (orderId) {
      const orderRef = doc(db, "orders", orderId);
      const unsubscribe = onSnapshot(orderRef, async (docSnap) => {
        if (docSnap.exists()) {
          const mappedOrder = await mapFirestoreDocToOrder(docSnap);
          setOrder(mappedOrder);
          // Cache the fetched order details
          try {
            localStorage.setItem(`order-cache-${orderId}`, JSON.stringify(mappedOrder));
          } catch (error) {
            console.error(`Failed to cache order ${orderId}:`, error);
          }
        } else {
          setOrder(null);
          toast({ variant: "destructive", title: "Error", description: "Order not found." });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching order details:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch order details. Showing cached data if available." });
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No order ID provided."});
    }
  }, [orderId, toast]);
  
  // Effect to manage live location tracking based on order status
  useEffect(() => {
    const isOrderActiveForTracking = order?.orderStatus === 'picked-up' || order?.orderStatus === 'out-for-delivery';

    const startWatching = () => {
      if (locationWatcherId.current !== null || !isOrderActiveForTracking) return;

      locationWatcherId.current = navigator.geolocation.watchPosition(
        (position) => {
          throttledLocationUpdate(position);
        },
        (error) => {
          console.warn(`Geolocation Error: ${error.message}`);
          if (error.code === 1) { // PERMISSION_DENIED
            toast({
              variant: "destructive",
              title: "Location Access Denied",
              description: "Live location tracking requires permission to access your location.",
              duration: 10000,
            });
            stopWatching();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    const stopWatching = () => {
      if (locationWatcherId.current !== null) {
        navigator.geolocation.clearWatch(locationWatcherId.current);
        locationWatcherId.current = null;
      }
    };

    if (isOrderActiveForTracking) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => stopWatching(); // Cleanup on component unmount or when order status changes

  }, [order?.orderStatus, throttledLocationUpdate, toast]);


  const handleStartStoreNavigation = () => {
    if (order?.pickupLocation) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.pickupLocation)}`;
      window.open(mapsUrl, "_blank");
      toast({ title: "Navigation Started", description: `Routing to ${order.pickupLocation}.`});
    }
  };

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

  const handleOutOfDelivery = async () => {
    if (order && order.orderStatus === "picked-up") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { orderStatus: "out-for-delivery" });
        toast({ title: "Out for Delivery", description: `Order ${order.id.substring(0,8)} is now out for delivery.`, className: "bg-blue-500 text-white" });
      } catch (error) {
        console.error("Error setting out for delivery:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update status." });
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  const handleArrived = async () => {
    if (order && order.orderStatus === "out-for-delivery") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { orderStatus: "arrived" });
        toast({ title: "Arrived at Location", description: `You have arrived at the customer's location.`, className: "bg-blue-500 text-white" });
      } catch (error) {
        console.error("Error setting arrived:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update status." });
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

  const handleDeliveryConfirmed = async (proof?: {type: 'photo' | 'signature', value: string}) => {
    if (order) {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);

        const updateData: any = {
          orderStatus: "delivered",
          completedAt: serverTimestamp(),
        };

        if (proof?.type === 'photo') {
            updateData.proofImageURL = proof.value;
        }

        await updateDoc(orderRef, updateData);

        toast({ title: "Delivery Confirmed!", description: `Order ${order.id.substring(0,8)} marked as delivered.`, className: "bg-green-500 text-white" });
        // We no longer redirect, so the user can see the confirmation on this page.
        // router.push("/dashboard"); 
      } catch (error) {
        console.error("Error confirming delivery:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not confirm delivery." });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleRedispatch = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        deliveryPartnerId: null,
        orderStatus: "Placed",
      });
      toast({
        title: "Order Released",
        description: "The order has been returned to the pool for other drivers.",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error redispatching order:", error);
      toast({
        variant: "destructive",
        title: "Redispatch Failed",
        description: "Could not release the order. Please contact support.",
      });
      setIsUpdating(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return <div className="flex justify-center items-center h-full min-h-[calc(100vh-10rem)]"><p>Order not found or an error occurred.</p></div>;
  }

  const isOrderActive = order.orderStatus === 'accepted' || order.orderStatus === 'picked-up' || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'arrived';

  return (
    <div className="space-y-8 p-4 md:p-6">
      <OrderDetailsDisplay order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            {order.orderStatus === "accepted" && (
              <>
                <Button onClick={handleStartStoreNavigation} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  <Store className="mr-2 h-5 w-5" /> Navigate to Store
                </Button>
                <Button onClick={handlePickupConfirmation} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-5 w-5" />}
                   Confirm Pickup from Store
                </Button>
              </>
            )}

            {order.orderStatus === "picked-up" && (
              <Button onClick={handleOutOfDelivery} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-5 w-5" />}
                 Out for Delivery
              </Button>
            )}

             {order.orderStatus === "out-for-delivery" && (
              <>
                <Button onClick={handleStartNavigation} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-6 font-bold" disabled={isUpdating}>
                  <Navigation className="mr-2 h-5 w-5" /> Navigate to Customer
                </Button>
                <Button onClick={handleArrived} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                    Arrived at Location
                </Button>
              </>
            )}

             <Button variant="outline" className="w-full" onClick={() => router.push(`/communication?orderId=${order.id}`)} disabled={isUpdating}>
                <MessageSquare className="mr-2 h-5 w-5" /> Contact Customer
            </Button>

            {isOrderActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isUpdating}>
                    <ShieldX className="mr-2 h-5 w-5" /> Release Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to release this order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The order will be returned to the pool for other drivers to accept. Only do this if you are unable to complete the delivery.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRedispatch} className="bg-destructive hover:bg-destructive/90">
                      Yes, Release Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </div>

        {order.orderStatus === "arrived" && (
          <DeliveryConfirmation order={order} onConfirm={handleDeliveryConfirmed} isUpdating={isUpdating} />
        )}
      </div>

       {order.orderStatus === "cancelled" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Order Cancelled</AlertTitle>
          <AlertDescription>
            This order has been cancelled. No further action is required.
          </AlertDescription>
        </Alert>
      )}

      {order.orderStatus === "delivered" && (
        <Card className="mt-6 bg-green-100 border-green-300">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-xl font-semibold text-green-800">This order has been successfully delivered!</p>
            {order.proofImageURL && (
                <div className="mt-4">
                    <p className="text-sm text-green-700">Proof of delivery:</p>
                    <a href={order.proofImageURL} target="_blank" rel="noopener noreferrer">
                         <img src={order.proofImageURL} alt="Proof of delivery" className="rounded-md max-h-48 w-auto object-contain border mx-auto mt-2 shadow-sm" data-ai-hint="delivery package" />
                    </a>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
