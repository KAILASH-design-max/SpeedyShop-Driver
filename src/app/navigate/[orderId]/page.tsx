

"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Navigation, Loader2, Truck, Phone, MessageSquare, Clock, Route } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { Order } from '@/types';
import { mapFirestoreDocToOrder } from '@/lib/orderUtils';
import { useToast } from '@/hooks/use-toast';

interface RouteDetails {
    distance: string;
    duration: string;
}

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
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);

    // Fetch Order Data
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
    
    // Watcher for live location updates
    useEffect(() => {
        let watcherId: number;
        if (navigator.geolocation) {
            watcherId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ lat: latitude, lng: longitude });
                },
                (error) => {
                    // This can happen if the user denies location permissions.
                    // We will not show a toast here to avoid annoying the user if it's intentional.
                },
                { enableHighAccuracy: true }
            );
        }
        return () => {
            if (watcherId) {
                navigator.geolocation.clearWatch(watcherId);
            }
        };
    }, []);
    
    // Initialize and update the map
    useEffect(() => {
        const initMap = async () => {
            const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
            const mapInstance = new Map(mapRef.current!, {
                center: { lat: 12.9716, lng: 77.5946 }, // Default center, will be updated
                zoom: 12,
                disableDefaultUI: true,
            });
            setMap(mapInstance);
        };
        if (mapRef.current && !map) {
            initMap();
        }
    }, [map]);

    // Update map with route when data is available
    useEffect(() => {
        if (map && order && currentLocation) {
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: '#29ABE2',
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                }
            });

            const destination = type === 'pickup' ? order.pickupLocation : order.dropOffLocation;

            directionsService.route({
                origin: currentLocation,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
            }, (response, status) => {
                if (status === 'OK' && response) {
                    directionsRenderer.setDirections(response);
                     const route = response.routes[0].legs[0];
                    if (route && route.distance && route.duration) {
                        setRouteDetails({
                            distance: route.distance.text,
                            duration: route.duration.text
                        });
                    }
                } else {
                    console.error('Directions request failed due to ' + status);
                }
            });
        }
    }, [map, order, currentLocation, type]);


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
             <div className="p-4 border-b flex items-center justify-between gap-2 bg-background z-10 absolute top-0 left-0 right-0">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-grow"></div>
                {order?.customerContact && (
                    <Button variant="outline" size="icon" asChild>
                        <a href={`tel:${order.customerContact}`} aria-label="Call customer">
                            <Phone className="h-5 w-5"/>
                        </a>
                    </Button>
                )}
                {order && (
                    <Button variant="outline" size="icon" onClick={() => router.push(`/chat?orderId=${order.id}`)}>
                        <MessageSquare className="h-5 w-5"/>
                    </Button>
                )}
                <Button variant="default" size="icon">
                    <Navigation className="h-5 w-5"/>
                </Button>
            </div>
            
            <div className="flex-grow relative mt-[73px]">
                {(loading || !map) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Loading Map...</p>
                    </div>
                ) : (
                    <>
                        <div ref={mapRef} className="w-full h-full" />
                        {routeDetails && (
                             <div className="absolute top-0 left-0 right-0 p-4">
                                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg flex justify-around items-center">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">ETA</p>
                                        <p className="font-bold text-primary text-lg flex items-center gap-1"><Clock size={16}/> {routeDetails.duration}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">Distance</p>
                                        <p className="font-bold text-primary text-lg flex items-center gap-1"><Route size={16}/> {routeDetails.distance}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="p-4 bg-background z-10">
                {renderBottomButton()}
            </div>
        </div>
    );
}
