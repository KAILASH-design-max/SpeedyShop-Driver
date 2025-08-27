
"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowLeft, Navigation, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Order } from '@/types';
import { mapFirestoreDocToOrder } from '@/lib/orderUtils';

export default function NavigatePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = typeof params.orderId === 'string' ? params.orderId : '';
    const type = searchParams.get('type') || 'dropoff'; // Default to dropoff

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [mapUrl, setMapUrl] = useState('');
    const [currentLocation, setCurrentLocation] = useState<string>('');

    const pageTitle = type === 'pickup' ? 'Navigate to Store' : 'Navigate to Customer';
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
                console.error("Error getting current location:", error);
                // Fallback or show error message
            }
        );
    }, []);

    useEffect(() => {
        if (order && mapsApiKey && currentLocation) {
            const destination = type === 'pickup' ? order.pickupLocation : order.dropOffLocation;
            const url = `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(currentLocation)}&destination=${encodeURIComponent(destination)}&mode=driving`;
            setMapUrl(url);
        }
    }, [order, mapsApiKey, currentLocation, type]);

    const handleOpenInMaps = () => {
        if (order) {
            const destination = type === 'pickup' ? order.pickupLocation : order.dropOffLocation;
            const externalMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
            window.open(externalMapsUrl, '_blank');
        }
    };


    return (
        <div className="h-full w-full bg-background flex flex-col">
             <div className="p-4 border-b flex items-center justify-between gap-4 bg-background z-10">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{pageTitle}</h1>
                        <p className="text-muted-foreground text-sm">Order #{orderId}</p>
                    </div>
                </div>
                 <Button onClick={handleOpenInMaps} size="sm">
                    <Navigation className="mr-2 h-4 w-4"/>
                    Open Native App
                </Button>
            </div>
            <div className="flex-grow relative">
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
        </div>
    );
}
