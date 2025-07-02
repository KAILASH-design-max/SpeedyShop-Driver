
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";

export default function EarningsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Earnings Breakdown</h1>
        <p className="text-muted-foreground mt-1">A summary of your current and lifetime earnings.</p>
      </div>

      <EarningsOverview />

      <EarningsSummaryCard />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <WeeklyEarningsChart />
        </div>
        <div className="lg:col-span-2">
          <PayoutHistoryTable />
        </div>
      </div>
    </div>
  );
}
