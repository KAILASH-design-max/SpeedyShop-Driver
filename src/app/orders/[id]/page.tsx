
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type { Order, DeliveryPartnerFeedback } from "@/types";
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
import { RateAndReport } from "@/components/orders/RateAndReport";
import Link from 'next/link';
import { CustomerChatDialog } from "@/components/communication/CustomerChatDialog";


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


  const handleArrivedAtStore = async () => {
    if (order && order.orderStatus === "accepted") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { orderStatus: "arrived-at-store" });
        toast({ title: "Arrived at Store", description: `You have arrived at the pickup location.`, className: "bg-blue-500 text-white" });
      } catch (error) {
        console.error("Error setting arrived at store:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update status." });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handlePickupConfirmation = async () => {
    if (order && order.orderStatus === "arrived-at-store") {
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
  
  const handleFeedbackSubmit = async (feedback: DeliveryPartnerFeedback) => {
    if (!order) return;
    setIsUpdating(true);
    try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, {
            deliveryPartnerFeedback: {
                ...feedback,
                reportedAt: serverTimestamp(),
            },
        });
        toast({
            title: "Feedback Submitted",
            description: "Thank you for helping us improve our service.",
            className: "bg-green-500 text-white",
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Could not submit your feedback. Please try again.",
        });
    } finally {
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

  const isOrderActive = ['accepted', 'arrived-at-store', 'picked-up', 'out-for-delivery', 'arrived'].includes(order.orderStatus);
  const isOrderComplete = ['delivered', 'cancelled'].includes(order.orderStatus);


  return (
    <div className="space-y-6 p-6">
      <OrderDetailsDisplay order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            {order.orderStatus === "accepted" && (
              <>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  <Link href={`/navigate/${order.id}?destination=${encodeURIComponent(order.pickupLocation)}&type=pickup`}>
                     <Store className="mr-2 h-5 w-5" /> Navigate to Store
                  </Link>
                </Button>
                <Button onClick={handleArrivedAtStore} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                   Arrived at Store
                </Button>
              </>
            )}

            {order.orderStatus === "arrived-at-store" && (
                 <Button onClick={handlePickupConfirmation} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-5 w-5" />}
                   Confirm Pickup from Store
                </Button>
            )}

            {order.orderStatus === "picked-up" && (
              <Button onClick={handleOutOfDelivery} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-5 w-5" />}
                 Out for Delivery
              </Button>
            )}

             {order.orderStatus === "out-for-delivery" && (
              <>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-6" size="lg" disabled={isUpdating}>
                  <Link href={`/navigate/${order.id}?destination=${encodeURIComponent(order.dropOffLocation)}&type=dropoff`}>
                     <Navigation className="mr-2 h-5 w-5" /> Navigate to Customer
                  </Link>
                </Button>
                <Button onClick={handleArrived} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                    Arrived at Location
                </Button>
              </>
            )}

            <CustomerChatDialog order={order}>
                <Button variant="outline" className="w-full" disabled={isUpdating || isOrderComplete}>
                    <MessageSquare className="mr-2 h-5 w-5" /> Contact Customer
                </Button>
            </CustomerChatDialog>

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
        <>
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

            <RateAndReport
                order={order}
                onSubmit={handleFeedbackSubmit}
                isSubmitting={isUpdating}
            />
        </>
      )}
    </div>
  );
}
