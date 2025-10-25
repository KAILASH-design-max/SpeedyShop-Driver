
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export function EarningsHeader() {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-primary">Earnings</h1>
        <p className="text-muted-foreground mt-1 hidden md:block">A summary of your current and lifetime earnings.</p>
      </div>
      <Button variant="destructive" onClick={() => router.push('/penalties')}>
        <ShieldX className="mr-2 h-4 w-4" />
        View Penalties
      </Button>
    </div>
  );
}
