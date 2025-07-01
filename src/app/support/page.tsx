import { Faq } from "@/components/support/Faq";
import { LiveChat } from "@/components/support/LiveChat";
import { EmergencySupport } from "@/components/support/EmergencySupport";

export default function SupportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LiveChat />
        </div>
        <div className="space-y-8">
          <EmergencySupport />
          <Faq />
        </div>
      </div>
    </div>
  );
}
