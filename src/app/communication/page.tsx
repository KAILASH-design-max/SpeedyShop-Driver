
"use client";

import { ChatInterface } from "@/components/communication/ChatInterface";
import { useSearchParams } from "next/navigation";

export default function CommunicationPage() {
  // The searchParams can be used to pre-select a chat if a user is navigated here.
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container mx-auto h-[calc(100vh-10rem)] flex flex-col p-0 md:p-6">
      <ChatInterface preselectedThreadId={orderId} />
    </div>
  );
}
