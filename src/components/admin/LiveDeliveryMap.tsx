
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import type { DeliveryLocation, Order, Profile } from '@/types';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LiveDriver {
    location: DeliveryLocation;
    order: Order | null;
    driver: Profile | null;
    marker: google.maps.Marker | null;
}

export function LiveDeliveryMap() {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [liveDrivers, setLiveDrivers] = useState<Record<string, LiveDriver>>({});
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

    const initMap = useCallback(async () => {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const mapInstance = new Map(mapRef.current!, {
            center: { lat: 12.9716, lng: 77.5946 }, // Default to Bangalore
            zoom: 12,
            mapId: 'DELIVERY_FLEET_MAP' // Optional: for custom styling
        });
        setMap(mapInstance);
        infoWindowRef.current = new google.maps.InfoWindow();
    }, []);

    useEffect(() => {
        if (mapRef.current && !map) {
            initMap();
        }
    }, [map, initMap]);


    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, "deliveryLocations"), async (snapshot) => {
            const updatedDrivers: Record<string, LiveDriver> = {};

            const promises = snapshot.docs.map(async (docSnap) => {
                const location = docSnap.data() as DeliveryLocation;
                const orderId = docSnap.id;

                try {
                    const orderRef = doc(db, "orders", orderId);
                    const orderSnap = await getDoc(orderRef);
                    
                    if (orderSnap.exists()) {
                        const order = orderSnap.data() as Order;
                        if (order.status !== 'delivered' && order.status !== 'cancelled' && order.deliveryPartnerId) {
                            const driverRef = doc(db, "users", order.deliveryPartnerId);
                            const driverSnap = await getDoc(driverRef);
                            const driver = driverSnap.exists() ? driverSnap.data() as Profile : null;
                            
                            updatedDrivers[orderId] = {
                                location,
                                order,
                                driver,
                                marker: liveDrivers[orderId]?.marker || null,
                            };
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch details for order ${orderId}:`, error);
                }
            });

            await Promise.all(promises);
            setLiveDrivers(prevDrivers => {
                // Clean up markers for drivers who are no longer active
                Object.keys(prevDrivers).forEach(orderId => {
                    if (!updatedDrivers[orderId]) {
                        prevDrivers[orderId].marker?.setMap(null);
                    }
                });
                return updatedDrivers;
            });
            setLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once

     // Effect to update markers on the map
    useEffect(() => {
        if (!map) return;

        Object.entries(liveDrivers).forEach(([orderId, data]) => {
            const { location, driver, order, marker } = data;
            const position = { lat: location.latitude, lng: location.longitude };

            const infoContent = `
                <div class="p-1 space-y-1 font-sans">
                    <p class="font-bold text-base">${driver?.name || 'Unknown Driver'}</p>
                    <p class="text-sm"><strong>Order:</strong> #${order?.id.substring(0, 6) || 'N/A'}</p>
                    <p class="text-sm"><strong>Destination:</strong> ${order?.dropOffLocation || 'N/A'}</p>
                </div>
            `;

            if (marker) {
                // Marker exists, update position and content
                marker.setPosition(position);
                if (marker.get('infoContent') !== infoContent) {
                    marker.set('infoContent', infoContent);
                }
            } else {
                // Create a new marker
                const newMarker = new google.maps.Marker({
                    position,
                    map,
                    title: driver?.name || `Order ${orderId}`,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#29ABE2',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                    },
                });

                newMarker.set('infoContent', infoContent);

                newMarker.addListener('click', () => {
                    if (infoWindowRef.current) {
                        infoWindowRef.current.setContent(newMarker.get('infoContent'));
                        infoWindowRef.current.open(map, newMarker);
                    }
                });

                setLiveDrivers(prev => ({
                    ...prev,
                    [orderId]: { ...prev[orderId], marker: newMarker },
                }));
            }
        });

    }, [liveDrivers, map]);

    return (
         <Card className="shadow-xl h-[calc(100vh-5rem)]">
            <div ref={mapRef} className="w-full h-full rounded-lg">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Loading Live Map...</p>
                    </div>
                )}
            </div>
         </Card>
    );
}
