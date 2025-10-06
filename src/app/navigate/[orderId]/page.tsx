
"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowLeft, Navigation, Loader2 } from 'lucide-react';
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

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
    
    useEffect(() => {
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
                console.error("Error getting current location:", error);
                // Fallback or show error message
            }
        );
    }, [toast]);

    useEffect(() => {
        if (order && mapsApiKey && currentLocation) {
            const destination = type === 'pickup' ? order.pickupLocation : order.dropOffLocation;
            const url = `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(currentLocation)}&destination=${encodeURIComponent(destination)}&mode=driving`;
            setMapUrl(url);
        }
    }, [order, mapsApiKey, currentLocation, type]);

    const handleConfirmArrival = async () => {
        if (!order) return;

        const targetStatus = type === 'pickup' ? 'arrived-at-store' : 'arrived';
        const successMessage = type === 'pickup' 
            ? "Arrived at Store" 
            : "Arrived at Location";
        const successDescription = type === 'pickup' 
            ? `You have arrived at the store.` 
            : `You have arrived at the customer's location.`;

        if (order.status === 'accepted' && type === 'pickup') {
            setIsUpdating(true);
            try {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: targetStatus });
                toast({ title: successMessage, description: successDescription, className: "bg-blue-500 text-white" });
                router.push(`/orders/${order.id}`);
            } catch (error) {
                console.error(`Error setting ${targetStatus}:`, error);
                toast({ variant: "destructive", title: "Error", description: "Could not update status." });
            } finally {
                setIsUpdating(false);
            }
        } else if (order.status === 'out-for-delivery' && type === 'dropoff') {
            setIsUpdating(true);
            try {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: targetStatus });
                toast({ title: successMessage, description: successDescription, className: "bg-blue-500 text-white" });
                 router.push(`/orders/${order.id}`);
            } catch (error) {
                console.error(`Error setting ${targetStatus}:`, error);
                toast({ variant: "destructive", title: "Error", description: "Could not update status." });
            } finally {
                setIsUpdating(false);
            }
        }
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
                 <Button onClick={handleConfirmArrival} className="w-full text-base font-bold py-6" size="lg" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm
                </Button>
            </div>
        </div>
    );
}
