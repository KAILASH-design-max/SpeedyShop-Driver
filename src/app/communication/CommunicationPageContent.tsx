
"use client";

import { ChatInterface } from "@/components/communication/ChatInterface";
import { useSearchParams } from "next/navigation";

export function CommunicationPageContent() {
  // The searchParams can be used to pre-select a chat if a user is navigated here.
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
      <ChatInterface preselectedThreadId={orderId} />
  );
}
