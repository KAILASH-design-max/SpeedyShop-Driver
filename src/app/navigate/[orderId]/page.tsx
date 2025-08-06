
"use client";

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { ArrowLeft, Navigation } from 'lucide-react';

export default function NavigatePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = params.orderId;
    const destination = searchParams.get('destination');
    const type = searchParams.get('type');
    const pageTitle = type === 'pickup' ? 'Navigate to Store' : 'Navigate to Customer';

    useEffect(() => {
        if (destination) {
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
            // Open in a new tab for a better user experience on mobile devices
            window.open(mapsUrl, '_blank');
        }
    }, [destination]);

    return (
        <div className="h-full w-full bg-background flex flex-col items-center justify-start pt-16 p-4 text-center">
            <div className="max-w-md">
                <Navigation className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
                <p className="text-muted-foreground mb-4">
                    Routing you to the {type === 'pickup' ? 'drop-off' : 'drop-off'} location for order #{orderId}. 
                    If Google Maps did not open automatically, please click the button below.
                </p>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || '')}`} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full">
                        <Navigation className="mr-2 h-5 w-5" />
                        Open Google Maps
                    </Button>
                </a>
                <Button variant="outline" onClick={() => router.back()} className="mt-4 w-full">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Go Back to Order
                </Button>
            </div>
        </div>
    );
}

    