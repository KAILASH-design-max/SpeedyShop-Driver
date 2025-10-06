
"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Navigation, Loader2, Truck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { Order } from '@/types';
import { mapFirestoreDocToOrder } from '@/lib/orderUtils';
import { useToast } from '@/hooks/use-toast';

export default function NavigatePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const orderId = typeof params.orderId === 'string' ? params.orderId : '';
    const type = searchParams.get('type') || 'dropoff'; // Default to dropoff

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [mapUrl, setMapUrl] = useState('');
    const [currentLocation, setCurrentLocation] = useState<string>('');
    
    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const orderRef = doc(db, "orders", orderId);
        const unsubscribe = onSnapshot(orderRef, async (docSnap) => {
            if (docSnap.exists()) {
                const mappedOrder = await mapFirestoreDocToOrder(docSnap);
                setOrder(mappedOrder);
            } else {
                setOrder(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching order:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderId]);
    
    // Get current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation(`${latitude},${longitude}`);
                },
                (error) => {
                    toast({
                      variant: "destructive",
                      title: "Location Error",
                      description: "Could not get current location. Please enable location services in your browser.",
                    });
                }
            );
        }
    }, [toast]);


    useEffect(() => {
        if (order && currentLocation) {
            const destination = type === 'pickup' ? order.pickupLocation : order.dropOffLocation;
            // The API key is now managed via environment variables for security.
            const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
            const url = `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(currentLocation)}&destination=${encodeURIComponent(destination)}&mode=driving`;
            setMapUrl(url);
        }
    }, [order, currentLocation, type]);

    const handleConfirmArrival = async () => {
        if (!order) return;
        
        const isReadyForDropoff = type === 'dropoff' && order.status === 'out-for-delivery';

        if (isReadyForDropoff) {
            setIsUpdating(true);
            try {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: "arrived" });
                toast({ title: "Arrival Confirmed", description: "You've arrived at the customer's location.", className: "bg-blue-500 text-white" });
                router.push(`/orders/${order.id}`);
            } catch (error) {
                console.error(`Error setting arrived:`, error);
                toast({ variant: "destructive", title: "Error", description: "Could not update status." });
            } finally {
                setIsUpdating(false);
            }
        }
    };
    
    const handleArrivedAtStore = async () => {
        if (order && order.status === 'accepted') {
            setIsUpdating(true);
            try {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: 'arrived-at-store' });
                toast({ title: "Arrived at Store", description: "You have arrived at the store.", className: "bg-blue-500 text-white" });
                // No redirect, just update status. The listener will update the UI.
            } catch (error) {
                console.error("Error setting arrived-at-store:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not update status." });
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const handlePickupFromStore = async () => {
        if (order && order.status === 'arrived-at-store') {
            setIsUpdating(true);
            try {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: 'picked-up' });
                toast({ title: "Pickup Confirmed", description: "Order has been marked as picked up.", className: "bg-green-500 text-white" });
                 // No redirect, just update status. The listener will update the UI.
            } catch (error) {
                console.error("Error setting picked-up:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not update status." });
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
            router.push(`/navigate/${order.id}?type=dropoff`);
          } catch (error) {
            console.error("Error setting out for delivery:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update status." });
          } finally {
            setIsUpdating(false);
          }
        }
    };

    const renderBottomButton = () => {
        if (!order) return null;

        if (type === 'pickup') {
            if (order.status === 'accepted') {
                return (
                    <Button onClick={handleArrivedAtStore} className="w-full text-base font-bold py-6" size="lg" disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Arrival at Store
                    </Button>
                );
            }
            if (order.status === 'arrived-at-store') {
                return (
                    <Button onClick={handlePickupFromStore} className="w-full text-base font-bold py-6 bg-green-500 hover:bg-green-600 text-white" size="lg" disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Pickup From Store
                    </Button>
                );
            }
            if (order.status === 'picked-up') {
                return (
                    <Button onClick={handleOutOfDelivery} className="w-full text-base font-bold py-6 bg-cyan-500 hover:bg-cyan-600 text-white" size="lg" disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-5 w-5" />}
                        Out for Delivery
                    </Button>
                );
            }
        }

        if (type === 'dropoff') {
             if (order.status === 'out-for-delivery') {
                return (
                    <Button onClick={handleConfirmArrival} className="w-full text-base font-bold py-6" size="lg" disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Arrival at Customer
                    </Button>
                );
            }
        }
        
        return null; // Don't show button for other statuses
    };


    return (
        <div className="h-full w-full bg-background flex flex-col">
             <div className="p-4 border-b flex items-center justify-between gap-4 bg-background z-10 absolute top-0 left-0 right-0">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button variant="destructive" size="icon">
                    <Navigation className="h-5 w-5"/>
                </Button>
            </div>
            <div className="flex-grow relative mt-20">
                 {(loading || !mapUrl) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Loading Map...</p>
                    </div>
                ) : (
                    <iframe
                        width="100%"
                        height="100%"
                        className="absolute inset-0"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={mapUrl}>
                    </iframe>
                )}
            </div>
            <div className="p-4 bg-background z-10 absolute bottom-0 left-0 right-0">
                {renderBottomButton()}
            </div>
        </div>
    );
}
