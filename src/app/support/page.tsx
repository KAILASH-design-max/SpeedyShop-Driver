import { Faq } from "@/components/support/Faq";
import { SupportChat } from "@/components/support/SupportChat";
import { EmergencySupport } from "@/components/support/EmergencySupport";

export default function SupportPage() {
  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           {/* This now renders the unified chat interface */}
          <SupportChat />
        </div>
        <div className="space-y-8">
          <EmergencySupport />
          <Faq />
        </div>
      </div>
    </div>
  );
}
