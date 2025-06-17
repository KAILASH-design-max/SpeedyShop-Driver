
import { EarningsSummaryCard } from "@/components/earnings/EarningsSummaryCard";
import { PayoutHistoryTable } from "@/components/earnings/PayoutHistoryTable";
import type { EarningSummary, Payout } from "@/types";
import { Separator } from "@/components/ui/separator";

const mockEarningsSummary: EarningSummary = {
  currentWeekEarnings: 255.75,
  completedDeliveriesToday: 8,
  activeBonuses: 2,
  overallRating: 4.7,
};

const mockPayouts: Payout[] = [
  { id: "PAYOUT001", date: "2024-07-15T10:00:00Z", amount: 150.50, status: "completed", transactionId: "TXN12345ABC" },
  { id: "PAYOUT002", date: "2024-07-08T10:00:00Z", amount: 120.00, status: "completed", transactionId: "TXN67890DEF" },
  { id: "PAYOUT003", date: "2024-07-01T10:00:00Z", amount: 180.25, status: "completed", transactionId: "TXN24680GHI" },
  { id: "PAYOUT004", date: "2024-07-22T10:00:00Z", amount: 95.00, status: "pending" },
];

export default function EarningsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <EarningsSummaryCard summary={mockEarningsSummary} />
      <Separator />
      <PayoutHistoryTable payouts={mockPayouts} />
    </div>
  );
}
