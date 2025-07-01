
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { ActiveBonuses } from "@/components/earnings/ActiveBonuses";
import { Separator } from "@/components/ui/separator";

export default function EarningsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Earnings Overview</h1>
        <p className="text-muted-foreground mt-1">Your performance and earnings at a glance.</p>
      </div>
      <EarningsOverview />
      <Separator />
      <WeeklyEarningsChart />
      <Separator />
      <ActiveBonuses /> 
      <Separator />
      <PayoutHistoryTable />
    </div>
  );
}
