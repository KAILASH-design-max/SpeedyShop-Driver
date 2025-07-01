
import { EarningsOverview } from "@/components/dashboard/EarningsOverview";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { Separator } from "@/components/ui/separator";
import { ActiveBonuses } from "@/components/earnings/ActiveBonuses";

export default function EarningsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Earnings Overview</h1>
        <p className="text-muted-foreground mt-1">A high-level summary of your earnings and performance.</p>
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
