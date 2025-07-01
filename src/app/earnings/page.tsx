
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { ActiveBonuses } from "@/components/earnings/ActiveBonuses";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { Separator } from "@/components/ui/separator";

export default function EarningsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Earnings Overview</h1>
        <p className="text-muted-foreground mt-1">Track your earnings, bonuses, and performance.</p>
      </div>
      <EarningsOverview />
      <Separator />
      <ActiveBonuses />
      <Separator />
      <WeeklyEarningsChart />
      <Separator />
      <PayoutHistoryTable />
    </div>
  );
}
