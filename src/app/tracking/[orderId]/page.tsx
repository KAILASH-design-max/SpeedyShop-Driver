
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { DeliveryLocation } from '@/types';

export default function TrackingPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = typeof params.orderId === 'string' ? params.orderId : '';

    const [location, setLocation] = useState<DeliveryLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [mapUrl, setMapUrl] = useState('');

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        const locationRef = doc(db, "deliveryLocations", orderId);
        const unsubscribe = onSnapshot(locationRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as DeliveryLocation;
                setLocation(data);
                
                // Correctly use all parts of the location data
                const origin = `${data.latitude},${data.longitude}`;
                const destination = data.destinationAddress;

                if (origin && destination && mapsApiKey) {
                    const url = `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`;
                    setMapUrl(url);
                }

            } else {
                setLocation(null);
                setMapUrl(''); // Clear map URL if location is not found
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching live location:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderId, mapsApiKey]);

    return (
        <div className="h-full w-full bg-background flex flex-col">
            <div className="p-4 border-b flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">Live Delivery Tracking</h1>
                    <p className="text-muted-foreground text-sm">Order #{orderId}</p>
                </div>
            </div>
            <div className="flex-grow">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Loading Map...</p>
                    </div>
                ) : mapUrl ? (
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={mapUrl}>
                    </iframe>
                ) : (
                    <div className="h-full flex items-center justify-center p-4 text-center">
                        <p className="text-destructive font-semibold">Could not load map. Location data or a valid API key may be unavailable.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
