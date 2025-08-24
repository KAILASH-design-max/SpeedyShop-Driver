
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { EarningsOverview } from '@/app/earnings/EarningsOverview';
import { WalletBalanceCard } from '@/components/earnings/WalletBalanceCard';
import { EarningsForecast } from '@/components/dashboard/EarningsForecast';

export default function EarningsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
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

      <div>
        <EarningsOverview />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
            <WalletBalanceCard />
            <EarningsForecast />
            <EarningsSummaryCard />
        </div>
        <div className="lg:col-span-2">
            <WeeklyEarningsChart />
        </div>
      </div>
    </div>
  );
}
