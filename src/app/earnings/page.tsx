
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";

export default function EarningsPage() {
  return (
    <div className="container mx-auto px-6 py-4 md:px-8 md:py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Earnings Breakdown</h1>
        <p className="text-muted-foreground mt-1">A summary of your current and lifetime earnings.</p>
      </div>

      <EarningsOverview />

      <EarningsSummaryCard />

      <WeeklyEarningsChart />
    </div>
  );
}
