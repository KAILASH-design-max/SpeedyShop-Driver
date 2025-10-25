
"use client";

import { useRouter } from 'next/navigation';
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { EarningsOverview } from '@/app/earnings/EarningsOverview';
import { WalletBalanceCard } from '@/components/earnings/WalletBalanceCard';
import { EarningsForecast } from '@/components/dashboard/EarningsForecast';
import { EarningsHeader } from '@/components/earnings/EarningsHeader';

export default function EarningsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
      <EarningsHeader />

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
