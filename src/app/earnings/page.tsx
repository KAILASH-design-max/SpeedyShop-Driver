
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { Separator } from "@/components/ui/separator";

export default function EarningsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary">Earnings Analytics</h1>
      <EarningsSummaryCard />
      <Separator />
      <WeeklyEarningsChart />
      <Separator />
      <PayoutHistoryTable />
    </div>
  );
}
