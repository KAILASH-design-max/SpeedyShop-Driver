
"use client";

import { PerformanceKPIs } from '@/components/analytics/PerformanceKPIs';
import { EarningsByHourChart } from '@/components/analytics/EarningsByHourChart';
import { TopEarningZones } from '@/components/analytics/TopEarningZones';

export default function AnalyticsPage() {

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Dive deep into your delivery data to optimize your strategy.
        </p>
      </div>

      <PerformanceKPIs />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3">
          <EarningsByHourChart />
        </div>
        <div className="lg:col-span-2">
          <TopEarningZones />
        </div>
      </div>

    </div>
  );
}
