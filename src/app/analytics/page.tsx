"use client";

import { PerformanceKPIs } from '@/components/analytics/PerformanceKPIs';
import { EarningsByHourChart } from '@/components/analytics/EarningsByHourChart';
import { TopEarningZones } from '@/components/analytics/TopEarningZones';

export default function AnalyticsPage() {

  return (
    <div className="space-y-6 md:p-6">
      <div className="px-4 md:px-0">
        <PerformanceKPIs />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start px-4 md:px-0">
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
