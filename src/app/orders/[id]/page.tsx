
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type { Order, DeliveryPartnerFeedback, Profile } from "@/types";
import { OrderDetailsDisplay } from "@/components/orders/OrderDetailsDisplay";
import { DeliveryConfirmation } from "@/components/orders/DeliveryConfirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, PackageCheck, MessageSquare, Loader2, CheckCircle, AlertTriangle, ShieldX, Store, Truck, MapPin, Map, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
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
import { User } from "firebase/auth";
import { Textarea } from "@/components/ui/textarea";

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = typeof params.id === 'string' ? params.id : '';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const locationWatcherId = useRef<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

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
    if (!orderId || !currentUser) {
        if (!auth.currentUser) setLoading(false);
        return;
    };
      
    const orderRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(orderRef, async (docSnap) => {
    if (docSnap.exists()) {
        const mappedOrder = await mapFirestoreDocToOrder(docSnap);
        
        // Ensure the current user has access to this order
        const canAccess = mappedOrder.deliveryPartnerId === currentUser.uid || (mappedOrder.accessibleTo || []).includes(currentUser.uid);

        if(canAccess) {
            setOrder(mappedOrder);
            
            if (mappedOrder.deliveryPartnerId) {
                const partnerRef = doc(db, "users", mappedOrder.deliveryPartnerId);
                const partnerSnap = await getDoc(partnerRef);
                if (partnerSnap.exists()) {
                    setDeliveryPartner(partnerSnap.data() as Profile);
                }
            } else {
                setDeliveryPartner(null);
            }

            // Cache the fetched order details
            try {
                localStorage.setItem(`order-cache-${orderId}`, JSON.stringify(mappedOrder));
            } catch (error) {
                console.error(`Failed to cache order ${orderId}:`, error);
            }
        } else {
            setOrder(null);
            setDeliveryPartner(null);
            toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this order." });
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
    
  }, [orderId, toast, currentUser]);
  
  // Effect to manage live location tracking based on order status
  useEffect(() => {
    const isOrderActiveForTracking = order?.status === 'picked-up' || order?.status === 'out-for-delivery';

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

  }, [order, throttledLocationUpdate, toast]);

  const handleAcceptOrder = async () => {
    if (order && currentUser) {
        setIsUpdating(true);
        try {
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, { 
              status: "accepted",
              deliveryPartnerId: currentUser.uid,
              accessibleTo: [], // Clear access pool once accepted
            });
            toast({
                title: "Order Accepted!",
                description: `Order #${order.id} has been moved to your active orders.`,
                className: "bg-green-500 text-white",
            });
        } catch (error) {
            console.error("Error accepting order:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not accept order." });
        } finally {
            setIsUpdating(false);
        }
    }
  };

  const handleArrivedAtStore = async () => {
    if (order && order.status === "accepted") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { status: "arrived-at-store" });
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
    if (order && order.status === "arrived-at-store") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { status: "picked-up" });
        toast({ title: "Pickup Confirmed", description: `Order #${order.id} marked as picked-up.`, className: "bg-blue-500 text-white" });
      } catch (error) {
        console.error("Error confirming pickup:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not confirm pickup." });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleOutOfDelivery = async () => {
    if (order && order.status === "picked-up") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { status: "out-for-delivery" });
        toast({ title: "Out for Delivery", description: `Order #${order.id} is now out for delivery.`, className: "bg-blue-500 text-white" });
      } catch (error) {
        console.error("Error setting out for delivery:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update status." });
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  const handleArrived = async () => {
    if (order && order.status === "out-for-delivery") {
      setIsUpdating(true);
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { status: "arrived" });
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
          status: "delivered",
          completedAt: serverTimestamp(),
        };

        if (proof?.type === 'photo') {
            updateData.proofImageURL = proof.value;
        }

        await updateDoc(orderRef, updateData);

        toast({ title: "Delivery Confirmed!", description: `Order #${order.id} marked as delivered.`, className: "bg-green-500 text-white" });
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
    if (cancellationReason.trim() === "") {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for releasing the order.",
      });
      return;
    }
    setIsUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        deliveryPartnerId: null,
        status: "Placed", // Or a new status like 'redispatched'
        cancellationReason: cancellationReason,
        lastStatus: order.status, // Keep track of where it was cancelled from
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
    } finally {
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

  const isOrderActive = ['accepted', 'arrived-at-store', 'picked-up', 'out-for-delivery', 'arrived'].includes(order.status);
  const isOrderComplete = ['delivered', 'cancelled'].includes(order.status);
  const isTrackingActive = ['picked-up', 'out-for-delivery'].includes(order.status);


  return (
    <div className="space-y-6 pb-6 px-1">
      <OrderDetailsDisplay order={order} deliveryPartner={deliveryPartner} />
      
      {order.status === "Placed" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Button onClick={handleAcceptOrder} className="w-full bg-green-500 hover:bg-green-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                    Accept Order
                </Button>
                <Button variant="outline" className="w-full text-base py-6 font-bold" onClick={() => router.push("/dashboard")}>
                    Go Back to Dashboard
                </Button>
            </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            {order.status === "accepted" && (
              <>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  <Link href={`/navigate/${order.id}?type=pickup`}>
                     <Store className="mr-2 h-5 w-5" /> Navigate to Store
                  </Link>
                </Button>
                <Button onClick={handleArrivedAtStore} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                   Arrived at Store
                </Button>
              </>
            )}

            {order.status === "arrived-at-store" && (
                 <Button onClick={handlePickupConfirmation} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-5 w-5" />}
                   Confirm Pickup from Store
                </Button>
            )}
            
            {order.status === "picked-up" && (
              <>
                <Button onClick={handleOutOfDelivery} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-5 w-5" />}
                  Out for Delivery
                </Button>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-6" size="lg" disabled={isUpdating}>
                  <Link href={`/navigate/${order.id}?type=dropoff`}>
                      <Navigation className="mr-2 h-5 w-5" /> Navigate to Customer
                  </Link>
                </Button>
              </>
            )}

             {order.status === "out-for-delivery" && (
              <>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-6" size="lg" disabled={isUpdating}>
                  <Link href={`/navigate/${order.id}?type=dropoff`}>
                     <Navigation className="mr-2 h-5 w-5" /> Navigate to Customer
                  </Link>
                </Button>
                <Button onClick={handleArrived} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-base py-6 font-bold" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                    Arrived at Location
                </Button>
              </>
            )}

            {isTrackingActive && (
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/tracking/${order.id}`} target="_blank">
                  <Map className="mr-2 h-4 w-4" /> Live Tracking Link (for Support)
                </Link>
              </Button>
            )}

            <Button variant="outline" className="w-full" disabled={isUpdating || isOrderComplete} onClick={() => router.push(`/chat?orderId=${order.id}`)}>
              <MessageSquare className="mr-2 h-5 w-5" /> Contact Support
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
                    <AlertDialogTitle>Reason for canceling the order:</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The order will be returned to the pool for other drivers to accept.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div>
                    <Textarea
                      placeholder="Type your note..."
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      maxLength={200}
                    />
                    <p className="text-right text-sm text-muted-foreground mt-1">
                      {cancellationReason.length}/200
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRedispatch} disabled={!cancellationReason.trim()}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </div>

        {order.status === "arrived" && (
          <DeliveryConfirmation order={order} onConfirm={handleDeliveryConfirmed} isUpdating={isUpdating} />
        )}
      </div>

       {order.status === "cancelled" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Order Cancelled</AlertTitle>
          <AlertDescription>
            This order has been cancelled. No further action is required.
          </AlertDescription>
        </Alert>
      )}

      {order.status === "delivered" && (
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
